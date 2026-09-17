package com.saimeng.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.common.BusinessException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** All text AI calls share this fixed server-side provider. Never returns credentials or reasoning. */
@Service
public class KimiClient {
    public static final String MODEL = "kimi-k3";
    private static final URI ENDPOINT = URI.create("https://api.moonshot.cn/v1/chat/completions");
    private final ObjectMapper mapper;
    private final String apiKey;
    private final HttpClient http;
    private final URI endpoint;

    @Autowired
    public KimiClient(ObjectMapper mapper, @Value("${MOONSHOT_API_KEY:}") String apiKey) {
        this(mapper, apiKey, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(), ENDPOINT);
    }

    KimiClient(ObjectMapper mapper, String apiKey, HttpClient http, URI endpoint) {
        this.mapper = mapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.http = http;
        this.endpoint = endpoint;
    }

    public boolean isReady() {
        return !apiKey.isBlank();
    }

    public String complete(String system, String prompt, Map<String, Object> schema) {
        if (!isReady()) {
            throw new BusinessException("AI 服务尚未开通，请联系管理员完成接入后重试。");
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", MODEL);
        body.put("reasoning_effort", "low");
        body.put("max_tokens", 8192);
        body.put("messages", List.of(Map.of("role", "system", "content", system),
                Map.of("role", "user", "content", prompt)));
        if (schema != null) {
            body.put("response_format", Map.of("type", "json_schema", "json_schema",
                    Map.of("name", "material_copy", "strict", true, "schema", schema)));
        }
        try {
            HttpRequest request = HttpRequest.newBuilder(endpoint)
                    .timeout(Duration.ofSeconds(120))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 401 || response.statusCode() == 403) {
                throw new BusinessException("AI 服务授权失败，请联系管理员检查密钥和模型权限。");
            }
            if (response.statusCode() == 429) {
                throw new BusinessException("AI 服务请求较多或额度不足，请稍后重试。");
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BusinessException("AI 服务暂时无法完成请求，请稍后重试。");
            }
            JsonNode choice = mapper.readTree(response.body()).path("choices").path(0);
            if (!"stop".equals(choice.path("finish_reason").asText())) {
                throw new BusinessException("AI 未能完整生成内容，请缩短要求后重试。");
            }
            String content = choice.path("message").path("content").asText("").trim();
            if (content.isBlank()) {
                throw new BusinessException("AI 没有返回可用内容，请重试。");
            }
            return content;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new BusinessException("生成已中断，请重新提交。");
        } catch (IOException exception) {
            // Do not reflect upstream response bodies, headers, or credentials to the browser.
            throw new BusinessException("AI 服务连接失败或响应超时，请稍后重试。");
        }
    }
}
