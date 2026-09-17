package com.saimeng.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.common.BusinessException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Lovart OpenAPI protocol from the installed lovart-media skill. */
@Component
public class LovartMaterialImageGenerator implements MaterialImageGenerator {
    static final String IMAGE_TOOL = "generate_image_gpt_image_2_5_flare";
    private final ObjectMapper mapper;
    private final String accessKey;
    private final String secretKey;
    private final String projectId;
    @Value("${AI_REFERENCE_ROOT:}")
    private String referenceRoot = "";
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

    public LovartMaterialImageGenerator(ObjectMapper mapper, @Value("${LOVART_ACCESS_KEY:}") String accessKey,
                                       @Value("${LOVART_SECRET_KEY:}") String secretKey,
                                       @Value("${LOVART_PROJECT_ID:}") String projectId) {
        this.mapper = mapper;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.projectId = projectId;
    }

    @Override
    public boolean isReady() {
        return !accessKey.isBlank() && !secretKey.isBlank() && !projectId.isBlank();
    }

    @Override
    public ImageResult generate(ImageRequest request) {
        if (!isReady()) return result(request, "WAITING_FOR_PROVIDER", "Lovart 密钥或项目尚未配置。", List.of());
        String threadId = "";
        try {
            List<String> references = new ArrayList<>();
            for (String reference : request.referenceImages().stream().limit(1).toList()) {
                if (publicHttps(reference)) references.add(reference);
                else if (!referenceRoot.isBlank() && reference.startsWith("/home/")) {
                    Path root = Path.of(referenceRoot).toRealPath();
                    Path file = root.resolve(reference.substring(1)).normalize();
                    if (Files.isRegularFile(file) && file.toRealPath().startsWith(root)
                            && file.toString().toLowerCase().matches(".*\\.(png|jpg|jpeg|webp)$")
                            && Files.size(file) <= 15 * 1024 * 1024) references.add(upload(file));
                }
            }
            if (references.isEmpty()) return result(request, "WAITING_FOR_REFERENCE",
                    "请先为商品补充可访问的参考图，避免生成不准确的商品包装。", List.of());
            var sent = call("POST", "/chat", "", chatPayload(request, references.get(0)));
            threadId = sent.path("thread_id").asText();
            if (threadId.isBlank()) throw new BusinessException("Lovart 未返回任务编号。");
            String query = "?thread_id=" + URLEncoder.encode(threadId, StandardCharsets.UTF_8);
            long deadline = System.nanoTime() + Duration.ofMinutes(10).toNanos();
            boolean previousDone = false;
            while (System.nanoTime() < deadline) {
                if (Thread.currentThread().isInterrupted()) throw new InterruptedException();
                String state = call("GET", "/chat/status", query, null).path("status").asText();
                JsonNode output = call("GET", "/chat/result", query, null);
                if (output.hasNonNull("pending_confirmation") && !output.path("pending_confirmation").isEmpty())
                    return result(request, "PENDING_CONFIRMATION",
                            "Lovart 需要确认费用，尚未自动授权。请在 Lovart 项目中查看任务：" + threadId, List.of());
                if ("abort".equals(state))
                    return result(request, "FAILED", "Lovart 任务已中止，文案已保留。", List.of());
                // A second done observation avoids the provider's sub-agent startup race.
                if ("done".equals(state) && previousDone) {
                    List<String> urls = imageUrls(output);
                    boolean failures = output.hasNonNull("failures") && !output.path("failures").isEmpty();
                    String explanation = assistantMessage(output);
                    return result(request, urls.isEmpty() ? (failures || explanation.isBlank() ? "FAILED" : "NEEDS_INPUT") : failures ? "PARTIAL" : "COMPLETED",
                            urls.isEmpty() ? "Lovart 尚未生成图片。" + explanation
                                    + (failures ? "\n指定模型工具失败：" + failureSummary(output) : "") + "\n任务编号：" + threadId
                                    : failures ? "图片已返回，但指定的 GPT Image 2.5 工具可能被拒绝或发生降级，请核对 Lovart 任务："
                                            + threadId + "。\n" + failureSummary(output) : "图片已生成。", urls);
                }
                previousDone = "done".equals(state);
                Thread.sleep(3000);
            }
            return result(request, "TIMEOUT", "Lovart 仍在处理，请在项目中查看任务：" + threadId + "，不要重复提交。", List.of());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return result(request, "INTERRUPTED", "等待已中断，Lovart 任务可能仍在执行：" + threadId, List.of());
        } catch (Exception exception) {
            return result(request, "FAILED", (exception instanceof BusinessException ? exception.getMessage()
                    : "Lovart 连接失败，文案已保留。")
                    + (threadId.isBlank() ? "" : "已提交任务：" + threadId + "，请先检查任务状态再重试。"), List.of());
        }
    }

    private ImageResult result(ImageRequest request, String status, String message, List<String> urls) {
        return new ImageResult(status, message, urls, request);
    }

    Map<String, Object> chatPayload(ImageRequest request, String mainImageUrl) {
        String prompt = request.prompt() + "\n\n所选商品 ID：" + request.productId()
                + "\n所选商品名称：" + request.productName()
                + "\n商品主图参考素材（与本次 attachments 中唯一图片相同）：" + mainImageUrl
                + "\n请以此主图中的商品作为唯一产品主体，保持包装、商标、标签、形状和颜色；"
                + "只调整背景、构图及宣传排版，不引用相册、项目画布或其他历史商品图片。"
                + "若主图与商品资料不匹配，请明确指出，不要虚构包装。"
                + "\n模型要求：仅使用 GPT Image 2.5 Flare（" + IMAGE_TOOL + "）生图。"
                + "若该工具不可用、被拒绝或需要额外费用确认，请返回具体原因，不要改用其他模型。";
        // Lovart exposes tool steering, not an enforced model whitelist.
        return Map.of("project_id", projectId, "prompt", prompt, "attachments", List.of(mainImageUrl), "mode", "fast",
                "tool_config", Map.of("prefer_tool_categories", Map.of("IMAGE", List.of(IMAGE_TOOL)),
                        "include_tools", List.of(IMAGE_TOOL)));
    }

    static String failureSummary(JsonNode output) {
        List<String> failures = new ArrayList<>();
        for (JsonNode failure : output.path("failures")) {
            failures.add(failure.path("tool_hint").asText(failure.path("tool").asText("image tool"))
                    + ": " + failure.path("code").asText("TOOL_FAILED"));
        }
        return String.join("; ", failures.stream().distinct().limit(5).toList());
    }

    static List<String> imageUrls(JsonNode output) {
        List<String> urls = new ArrayList<>();
        for (JsonNode item : output.path("items")) {
            for (JsonNode artifact : item.path("artifacts")) {
                String url = artifact.path("content").asText("");
                if ("image".equals(artifact.path("type").asText()) && url.startsWith("https://")) urls.add(url);
            }
        }
        return urls.stream().distinct().toList();
    }

    static String assistantMessage(JsonNode output) {
        String message = "";
        for (JsonNode item : output.path("items")) {
            if ("assistant".equals(item.path("type").asText())) message = item.path("text").asText("");
        }
        message = message.replaceAll("(?i)(sk|ak)[-_][a-z0-9_-]{12,}", "[redacted]");
        return message.substring(0, Math.min(message.length(), 1600));
    }

    private boolean publicHttps(String value) {
        try {
            URI uri = URI.create(value);
            String host = uri.getHost();
            return "https".equals(uri.getScheme()) && host != null && host.contains(".")
                    && !host.equals("localhost") && !host.endsWith(".local")
                    && !host.matches("[0-9.]+") && uri.getUserInfo() == null;
        } catch (RuntimeException exception) { return false; }
    }

    private JsonNode call(String method, String suffix, String query, Object body) throws Exception {
        String path = "/v1/openapi" + suffix;
        var builder = signedRequest(method, path, query).header("Content-Type", "application/json");
        if (body == null) builder.GET();
        else builder.header("Idempotency-Key", UUID.randomUUID().toString())
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)));
        return responseData(http.send(builder.build(), HttpResponse.BodyHandlers.ofString()));
    }

    private String upload(Path file) throws Exception {
        String boundary = UUID.randomUUID().toString();
        var bytes = new ByteArrayOutputStream();
        bytes.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"reference."
                + file.toString().substring(file.toString().lastIndexOf('.') + 1)
                + "\"\r\nContent-Type: application/octet-stream\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        Files.copy(file, bytes);
        bytes.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        var request = signedRequest("POST", "/v1/openapi/file/upload", "")
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(bytes.toByteArray())).build();
        String url = responseData(http.send(request, HttpResponse.BodyHandlers.ofString())).path("url").asText();
        if (!publicHttps(url)) throw new BusinessException("Lovart 参考图上传未返回有效地址。");
        return url;
    }

    private HttpRequest.Builder signedRequest(String method, String path, String query) throws Exception {
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String signature = HexFormat.of().formatHex(mac.doFinal((method + "\n" + path + "\n" + timestamp).getBytes(StandardCharsets.UTF_8)));
        return HttpRequest.newBuilder(URI.create("https://lgw.lovart.ai" + path + query))
                .timeout(Duration.ofSeconds(45)).header("X-Access-Key", accessKey)
                .header("X-Timestamp", timestamp).header("X-Signature", signature)
                .header("X-Signed-Method", method).header("X-Signed-Path", path)
                .header("User-Agent", "LovartAgentSkill/1.0");
    }

    private JsonNode responseData(HttpResponse<String> response) throws Exception {
        if (response.statusCode() == 401 || response.statusCode() == 403)
            throw new BusinessException("Lovart 授权失败，请检查服务端密钥和项目权限。");
        if (response.statusCode() == 402) throw new BusinessException("Lovart 额度不足或账户受限，请检查账户。");
        if (response.statusCode() == 429) throw new BusinessException("Lovart 请求频率受限，请稍后重试。");
        if (response.statusCode() != 200) throw new BusinessException("Lovart 服务暂不可用（HTTP " + response.statusCode() + "）。");
        var json = mapper.readTree(response.body());
        if (json.path("code").asInt(0) != 0) throw new BusinessException("Lovart 拒绝了请求，请检查项目权限和账户状态。");
        return json.has("data") ? json.path("data") : json;
    }
}
