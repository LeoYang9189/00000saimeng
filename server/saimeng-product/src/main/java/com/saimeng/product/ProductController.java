package com.saimeng.product;

import com.saimeng.auth.CurrentUserContext;
import com.saimeng.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 商品与公海库接口。
 */
@RestController
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
        seedPlatformProducts();
    }

    /**
     * 查询公海商品池。
     *
     * @return 商品列表
     */
    @GetMapping("/api/products/public-pool")
    public ApiResponse<List<ProductService.ProductRecord>> listPublicPoolProducts() {
        return ApiResponse.success(productService.listPublicPoolProducts());
    }

    /**
     * 查询商城公开商品详情。
     *
     * @param productId 商品 ID
     * @return 商品详情
     */
    @GetMapping("/api/products/{productId}")
    public ApiResponse<ProductService.PublicProductDetailRecord> getPublicProductDetail(@PathVariable Long productId) {
        return ApiResponse.success(productService.getPublicProductDetail(productId));
    }

    /**
     * 分销商选品入库。
     *
     * @param request 选品请求
     * @return 分销关系
     */
    @PostMapping("/api/merchant/products/select")
    public ApiResponse<ProductService.MerchantProductRelation> selectPublicProduct(
            @Valid @RequestBody SelectProductRequest request) {
        return ApiResponse.success(productService.selectPublicProduct(
                CurrentUserContext.getCurrentUser().userId(),
                request.productId()));
    }

    /**
     * 分销商提报自有商品。
     *
     * @param request 商品提报请求
     * @return 商品记录
     */
    @PostMapping("/api/merchant/products")
    public ApiResponse<ProductService.ProductRecord> submitMerchantProduct(
            @Valid @RequestBody ProductDraftRequest request) {
        return ApiResponse.success(productService.submitMerchantProduct(
                CurrentUserContext.getCurrentUser().userId(),
                request.productName(),
                request.originCountry(),
                request.sellingPoint()));
    }

    /**
     * 查询分销商自己的分销商品。
     *
     * @return 分销商品列表
     */
    @GetMapping("/api/merchant/products")
    public ApiResponse<List<ProductService.MerchantProductView>> listMerchantProducts() {
        return ApiResponse.success(productService.listMerchantProducts(CurrentUserContext.getCurrentUser().userId()));
    }

    /**
     * 运营后台直接上传平台商品。
     *
     * @param request 商品请求
     * @return 商品记录
     */
    @PostMapping("/api/admin/products")
    public ApiResponse<ProductService.ProductRecord> createPlatformProduct(
            @Valid @RequestBody ProductDraftRequest request) {
        return ApiResponse.success(productService.createPlatformProduct(
                CurrentUserContext.getCurrentUser().userId(),
                request.productName(),
                request.originCountry(),
                request.sellingPoint()));
    }

    /**
     * 查询待审核商品列表。
     *
     * @return 商品列表
     */
    @GetMapping("/api/admin/products/pending")
    public ApiResponse<List<ProductService.ProductRecord>> listPendingProducts() {
        return ApiResponse.success(productService.listPendingProducts());
    }

    /**
     * 审核通过商品。
     *
     * @param productId 商品 ID
     * @return 商品记录
     */
    @PostMapping("/api/admin/products/{productId}/approve")
    public ApiResponse<ProductService.ProductRecord> approveProduct(@PathVariable Long productId) {
        return ApiResponse.success(productService.approveProduct(productId, CurrentUserContext.getCurrentUser().userId()));
    }

    /**
     * 驳回商品。
     *
     * @param productId 商品 ID
     * @return 商品记录
     */
    @PostMapping("/api/admin/products/{productId}/reject")
    public ApiResponse<ProductService.ProductRecord> rejectProduct(@PathVariable Long productId) {
        return ApiResponse.success(productService.rejectProduct(productId, CurrentUserContext.getCurrentUser().userId()));
    }

    private void seedPlatformProducts() {
        if (!productService.listPublicPoolProducts().isEmpty()) {
            return;
        }
        productService.createPlatformProduct(1L, "法国原瓶进口红酒", "法国", "适合高复购私域分销场景");
        productService.createPlatformProduct(1L, "德国黑啤礼盒", "德国", "节庆礼赠与小店团购转化更强");
    }

    public record ProductDraftRequest(
            @NotBlank(message = "商品名称不能为空") String productName,
            @NotBlank(message = "原产地不能为空") String originCountry,
            @NotBlank(message = "卖点不能为空") String sellingPoint) {
    }

    public record SelectProductRequest(Long productId) {
    }
}
