package com.saimeng.admin;

import com.saimeng.ai.AiWorkbenchService;
import com.saimeng.common.ApiResponse;
import com.saimeng.common.BusinessException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
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

    public AiWorkbenchController(AiWorkbenchService ai, OperatorCatalogService catalog) {
        this.ai = ai;
        this.catalog = catalog;
    }

    @GetMapping
    public ApiResponse<AiWorkbenchService.Capabilities> capabilities() {
        return ApiResponse.success(ai.capabilities());
    }

    @PostMapping("/materials")
    public ApiResponse<AiWorkbenchService.MaterialResult> materials(@Valid @RequestBody MaterialRequest request) {
        // Fetch authoritative facts by ID. Never trust prices/names or reference images sent by the client.
        OperatorCatalogService.ProductRecord product = catalog.getProduct(request.productId());
        if (!product.enabled() || !"APPROVED".equals(product.auditStatus())) {
            throw new BusinessException("请选择已启用且审核通过的商品。");
        }
        List<String> references = new ArrayList<>();
        if (product.mainImage() != null && !product.mainImage().isBlank()) references.add(product.mainImage());
        if (product.galleryImages() != null) references.addAll(product.galleryImages());
        references = references.stream().filter(value -> value != null && !value.isBlank()).distinct().limit(4).toList();
        var facts = new AiWorkbenchService.ProductFacts(product.id(), product.productName(), product.productCode(),
                product.brandName(), product.categoryName(), product.originCountry(), product.sellingPoint(),
                product.netContent(), product.ingredients(), product.retailPrice(), references);
        return ApiResponse.success(ai.createMaterial(facts, request.channel(), request.style(), request.notes()));
    }

    @PostMapping("/chat")
    public ApiResponse<AiWorkbenchService.ChatResult> chat(@Valid @RequestBody ChatRequest request) {
        List<AiWorkbenchService.ChatTurn> history = request.history() == null ? List.of() : request.history().stream()
                .map(item -> new AiWorkbenchService.ChatTurn(item.role(), item.content())).toList();
        return ApiResponse.success(ai.chat(request.skill(), request.message().trim(), history));
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
