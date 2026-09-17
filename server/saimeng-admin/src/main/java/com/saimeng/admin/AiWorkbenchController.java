package com.saimeng.admin;

import com.saimeng.ai.AiWorkbenchService;
import com.saimeng.common.ApiResponse;
import com.saimeng.common.BusinessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/ai/workbench")
public class AiWorkbenchController {
    private final AiWorkbenchService ai;
    private final OperatorCatalogService catalog;
    private final ObjectMapper mapper;
    private final KnowledgeService knowledge;

    public AiWorkbenchController(AiWorkbenchService ai, OperatorCatalogService catalog, ObjectMapper mapper) {
        this(ai, catalog, mapper, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public AiWorkbenchController(AiWorkbenchService ai, OperatorCatalogService catalog, ObjectMapper mapper, KnowledgeService knowledge) {
        this.ai = ai;
        this.catalog = catalog;
        this.mapper = mapper;
        this.knowledge = knowledge;
    }

    @GetMapping
    public ApiResponse<AiWorkbenchService.Capabilities> capabilities() {
        return ApiResponse.success(ai.capabilities());
    }

    @PostMapping("/materials")
    public ApiResponse<AiWorkbenchService.MaterialResult> materials(@Valid @RequestBody MaterialRequest request) {
        return ApiResponse.success(ai.createMaterial(productFacts(request), request.channel(), request.style(), request.notes()));
    }

    @PostMapping(value = "/materials/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> streamMaterials(@Valid @RequestBody MaterialRequest request) {
        var facts = productFacts(request);
        return stream(events -> {
            var result = ai.createMaterial(facts, request.channel(), request.style(), request.notes(), events);
            events.accept("material", result);
            events.accept("done", true);
        });
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> streamChat(@Valid @RequestBody ChatRequest request) {
        var history = request.history() == null ? List.<AiWorkbenchService.ChatTurn>of() : request.history().stream()
                .map(item -> new AiWorkbenchService.ChatTurn(item.role(), item.content())).toList();
        return stream(events -> {
            events.accept("stage", "正在生成回答");
            if ("knowledge".equals(request.skill())) knowledge.answer(request.message().trim(), history, events);
            else ai.chat(request.skill(), request.message().trim(), history, events);
            events.accept("done", true);
        });
    }

    ResponseEntity<StreamingResponseBody> stream(Consumer<BiConsumer<String, Object>> work) {
        StreamingResponseBody body = output -> {
            BiConsumer<String, Object> events = (event, data) -> {
                try {
                    output.write(("event: " + event + "\ndata: " + mapper.writeValueAsString(data) + "\n\n")
                            .getBytes(StandardCharsets.UTF_8));
                    output.flush();
                } catch (IOException exception) { throw new UncheckedIOException(exception); }
            };
            try {
                work.accept(events);
            } catch (UncheckedIOException disconnected) {
                // Stop work when the browser closes its stream.
            } catch (Exception exception) {
                try {
                    events.accept("error", Map.of("message", exception instanceof BusinessException
                            ? exception.getMessage() : "生成失败，请稍后重试。"));
                } catch (UncheckedIOException disconnected) { /* Client already left. */ }
            }
        };
        return ResponseEntity.ok().header("Cache-Control", "no-cache, no-transform")
                .header("X-Accel-Buffering", "no").contentType(MediaType.TEXT_EVENT_STREAM).body(body);
    }

    private AiWorkbenchService.ProductFacts productFacts(MaterialRequest request) {
        // Fetch authoritative facts by ID. Never trust prices/names or reference images sent by the client.
        OperatorCatalogService.ProductRecord product = catalog.getProduct(request.productId());
        if (!product.enabled() || !"APPROVED".equals(product.auditStatus())) {
            throw new BusinessException("请选择已启用且审核通过的商品。");
        }
        if (product.mainImage() == null || product.mainImage().isBlank()) {
            throw new BusinessException("所选商品尚未设置主图，请先在商品中心设置主图后再生成素材。");
        }
        // Gallery and thumbnail images may depict other products; only the selected main image is authoritative.
        List<String> references = List.of(product.mainImage().trim());
        var facts = new AiWorkbenchService.ProductFacts(product.id(), product.productName(), product.productCode(),
                product.brandName(), product.categoryName(), product.originCountry(), product.sellingPoint(),
                product.netContent(), product.ingredients(), product.retailPrice(), references);
        return facts;
    }

    @PostMapping("/chat")
    public ApiResponse<AiWorkbenchService.ChatResult> chat(@Valid @RequestBody ChatRequest request) {
        List<AiWorkbenchService.ChatTurn> history = request.history() == null ? List.of() : request.history().stream()
                .map(item -> new AiWorkbenchService.ChatTurn(item.role(), item.content())).toList();
        return ApiResponse.success("knowledge".equals(request.skill())
                ? knowledge.answer(request.message().trim(), history, null) : ai.chat(request.skill(), request.message().trim(), history));
    }

    public record MaterialRequest(
            @NotNull(message = "请选择商品。") @Positive Long productId,
            @NotBlank(message = "请选择发布渠道。") String channel,
            @NotBlank(message = "请选择视觉风格。") String style,
            @Size(max = 2000, message = "补充要求最多2000字。") String notes) { }
    public record HistoryTurn(@NotBlank @Pattern(regexp = "user|assistant") String role,
                              @NotBlank @Size(max = 12000) String content) { }
    public record ChatRequest(@NotBlank String skill,
                              @NotBlank(message = "请输入问题。") @Size(max = 4000) String message,
                              @Size(max = 12) List<@NotNull @Valid HistoryTurn> history) { }
}
