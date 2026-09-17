package com.saimeng.admin;

import com.saimeng.auth.CurrentUserContext;
import com.saimeng.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 运营后台商品库与分类管理接口。
 */
@RestController
public class OperatorCatalogController {

    private final OperatorCatalogService operatorCatalogService;

    public OperatorCatalogController(OperatorCatalogService operatorCatalogService) {
        this.operatorCatalogService = operatorCatalogService;
    }

    @GetMapping("/api/admin/catalog/bootstrap")
    public ApiResponse<OperatorCatalogService.CatalogBootstrapPayload> getBootstrap() {
        return ApiResponse.success(operatorCatalogService.getBootstrap());
    }

    @PostMapping("/api/admin/catalog/categories")
    public ApiResponse<OperatorCatalogService.CategoryRecord> createCategory(
            @Valid @RequestBody OperatorCatalogService.CategoryUpsertRequest request) {
        return ApiResponse.success(operatorCatalogService.createCategory(request));
    }

    @PutMapping("/api/admin/catalog/categories/{categoryId}")
    public ApiResponse<OperatorCatalogService.CategoryRecord> updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody OperatorCatalogService.CategoryUpsertRequest request) {
        return ApiResponse.success(operatorCatalogService.updateCategory(categoryId, request));
    }

    @DeleteMapping("/api/admin/catalog/categories/{categoryId}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long categoryId) {
        operatorCatalogService.deleteCategory(categoryId);
        return ApiResponse.success(null);
    }

    @PostMapping("/api/admin/catalog/products")
    public ApiResponse<OperatorCatalogService.ProductRecord> createProduct(
            @Valid @RequestBody OperatorCatalogService.ProductUpsertRequest request) {
        return ApiResponse.success(operatorCatalogService.createProduct(
                CurrentUserContext.getCurrentUser().userId(),
                request));
    }

    @PutMapping("/api/admin/catalog/products/{productId}")
    public ApiResponse<OperatorCatalogService.ProductRecord> updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody OperatorCatalogService.ProductUpsertRequest request) {
        return ApiResponse.success(operatorCatalogService.updateProduct(productId, request));
    }

    @DeleteMapping("/api/admin/catalog/products/{productId}")
    public ApiResponse<Void> deleteProduct(@PathVariable Long productId) {
        operatorCatalogService.deleteProduct(productId);
        return ApiResponse.success(null);
    }
}
