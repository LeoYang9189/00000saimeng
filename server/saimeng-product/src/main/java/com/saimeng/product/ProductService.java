package com.saimeng.product;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.common.BusinessException;
import com.saimeng.product.entity.MerchantProductRelationEntity;
import com.saimeng.product.entity.ProductSpuEntity;
import com.saimeng.product.mapper.MerchantProductRelationMapper;
import com.saimeng.product.mapper.ProductSpuMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 商品与公海库服务。
 */
@Service
public class ProductService {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final ProductSpuMapper productSpuMapper;
    private final MerchantProductRelationMapper merchantProductRelationMapper;
    private final ObjectMapper objectMapper;

    public ProductService(
            ProductSpuMapper productSpuMapper,
            MerchantProductRelationMapper merchantProductRelationMapper,
            ObjectMapper objectMapper) {
        this.productSpuMapper = productSpuMapper;
        this.merchantProductRelationMapper = merchantProductRelationMapper;
        this.objectMapper = objectMapper;
    }

    /**
     * 创建平台商品。
     *
     * @param operatorUserId 操作人 ID
     * @param productName 商品名称
     * @param originCountry 原产地
     * @param sellingPoint 卖点
     * @return 商品记录
     */
    @Transactional
    public ProductRecord createPlatformProduct(
            Long operatorUserId,
            String productName,
            String originCountry,
            String sellingPoint) {
        ProductSpuEntity entity = new ProductSpuEntity();
        entity.setId(IdWorker.getId());
        entity.setProductName(productName);
        entity.setOriginCountry(originCountry);
        entity.setSellingPoint(sellingPoint);
        entity.setSourceType("PLATFORM");
        entity.setSourceMerchantUserId(null);
        entity.setAuditStatus("APPROVED");
        entity.setInPublicPool(true);
        entity.setEnabled(true);
        entity.setDeleted(false);
        entity.setCreatedByUserId(operatorUserId);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setReviewedByUserId(operatorUserId);
        entity.setReviewedAt(LocalDateTime.now());
        productSpuMapper.insert(entity);
        return toRecord(entity);
    }

    /**
     * 提报分销商自有商品。
     *
     * @param merchantUserId 分销商用户 ID
     * @param productName 商品名称
     * @param originCountry 原产地
     * @param sellingPoint 卖点
     * @return 商品记录
     */
    @Transactional
    public ProductRecord submitMerchantProduct(
            Long merchantUserId,
            String productName,
            String originCountry,
            String sellingPoint) {
        ProductSpuEntity entity = new ProductSpuEntity();
        entity.setId(IdWorker.getId());
        entity.setProductName(productName);
        entity.setOriginCountry(originCountry);
        entity.setSellingPoint(sellingPoint);
        entity.setSourceType("MERCHANT");
        entity.setSourceMerchantUserId(merchantUserId);
        entity.setAuditStatus("PENDING");
        entity.setInPublicPool(false);
        entity.setEnabled(true);
        entity.setDeleted(false);
        entity.setCreatedByUserId(merchantUserId);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        productSpuMapper.insert(entity);
        return toRecord(entity);
    }

    /**
     * 查询公海商品。
     *
     * @return 商品列表
     */
    public List<ProductRecord> listPublicPoolProducts() {
        return productSpuMapper.selectList(new LambdaQueryWrapper<ProductSpuEntity>()
                        .eq(ProductSpuEntity::getInPublicPool, true)
                        .eq(ProductSpuEntity::getAuditStatus, "APPROVED")
                        .eq(ProductSpuEntity::getEnabled, true)
                        .eq(ProductSpuEntity::getDeleted, false))
                .stream()
                .map(this::toRecord)
                .sorted(Comparator.comparing(ProductRecord::createdAt).reversed())
                .toList();
    }

    /**
     * 查询商城公开商品详情。
     *
     * @param productId 商品 ID
     * @return 商品详情
     */
    public PublicProductDetailRecord getPublicProductDetail(Long productId) {
        ProductSpuEntity entity = getRequiredProduct(productId);
        if (Boolean.TRUE.equals(entity.getDeleted())
                || !Boolean.TRUE.equals(entity.getEnabled())
                || !Boolean.TRUE.equals(entity.getInPublicPool())
                || !"APPROVED".equals(entity.getAuditStatus())) {
            throw new BusinessException("商品暂未开放展示");
        }
        return toPublicDetailRecord(entity);
    }

    /**
     * 查询待审核商品。
     *
     * @return 商品列表
     */
    public List<ProductRecord> listPendingProducts() {
        return productSpuMapper.selectList(new LambdaQueryWrapper<ProductSpuEntity>()
                        .eq(ProductSpuEntity::getAuditStatus, "PENDING")
                        .eq(ProductSpuEntity::getDeleted, false))
                .stream()
                .map(this::toRecord)
                .sorted(Comparator.comparing(ProductRecord::createdAt).reversed())
                .toList();
    }

    /**
     * 审核通过商品。
     *
     * @param productId 商品 ID
     * @param operatorUserId 审核人 ID
     * @return 商品记录
     */
    @Transactional
    public ProductRecord approveProduct(Long productId, Long operatorUserId) {
        ProductSpuEntity entity = getRequiredProduct(productId);
        entity.setAuditStatus("APPROVED");
        entity.setInPublicPool(true);
        entity.setReviewedByUserId(operatorUserId);
        entity.setReviewedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        productSpuMapper.updateById(entity);
        if ("MERCHANT".equals(entity.getSourceType()) && entity.getSourceMerchantUserId() != null) {
            createOrGetRelation(entity.getSourceMerchantUserId(), entity.getId(), "OWN_UPLOAD");
        }
        return toRecord(entity);
    }

    /**
     * 驳回商品。
     *
     * @param productId 商品 ID
     * @param operatorUserId 审核人 ID
     * @return 商品记录
     */
    @Transactional
    public ProductRecord rejectProduct(Long productId, Long operatorUserId) {
        ProductSpuEntity entity = getRequiredProduct(productId);
        entity.setAuditStatus("REJECTED");
        entity.setInPublicPool(false);
        entity.setReviewedByUserId(operatorUserId);
        entity.setReviewedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        productSpuMapper.updateById(entity);
        return toRecord(entity);
    }

    /**
     * 分销商从公海选品。
     *
     * @param merchantUserId 分销商用户 ID
     * @param productId 商品 ID
     * @return 分销关系
     */
    @Transactional
    public MerchantProductRelation selectPublicProduct(Long merchantUserId, Long productId) {
        ProductSpuEntity entity = getRequiredProduct(productId);
        if (!Boolean.TRUE.equals(entity.getInPublicPool()) || !"APPROVED".equals(entity.getAuditStatus())) {
            throw new BusinessException("该商品当前不可加入分销库");
        }
        return toRelationRecord(createOrGetRelation(merchantUserId, productId, "PUBLIC_POOL"));
    }

    /**
     * 查询分销商自己的分销商品。
     *
     * @param merchantUserId 分销商用户 ID
     * @return 商品列表
     */
    public List<MerchantProductView> listMerchantProducts(Long merchantUserId) {
        return merchantProductRelationMapper.selectList(new LambdaQueryWrapper<MerchantProductRelationEntity>()
                        .eq(MerchantProductRelationEntity::getMerchantUserId, merchantUserId))
                .stream()
                .sorted(Comparator.comparing(MerchantProductRelationEntity::getSelectedAt).reversed())
                .map(relation -> new MerchantProductView(
                        toRelationRecord(relation),
                        toRecord(productSpuMapper.selectById(relation.getProductId()))))
                .toList();
    }

    private ProductSpuEntity getRequiredProduct(Long productId) {
        ProductSpuEntity entity = productSpuMapper.selectById(productId);
        if (entity == null) {
            throw new BusinessException("商品不存在");
        }
        return entity;
    }

    private MerchantProductRelationEntity createOrGetRelation(Long merchantUserId, Long productId, String selectSource) {
        MerchantProductRelationEntity entity = merchantProductRelationMapper.selectOne(
                new LambdaQueryWrapper<MerchantProductRelationEntity>()
                        .eq(MerchantProductRelationEntity::getMerchantUserId, merchantUserId)
                        .eq(MerchantProductRelationEntity::getProductId, productId)
                        .last("limit 1"));
        if (entity != null) {
            return entity;
        }
        entity = new MerchantProductRelationEntity();
        entity.setId(IdWorker.getId());
        entity.setMerchantUserId(merchantUserId);
        entity.setProductId(productId);
        entity.setSelectSource(selectSource);
        entity.setDistributionLink("https://saimeng.local/distribution/" + UUID.randomUUID());
        entity.setSelectedAt(LocalDateTime.now());
        merchantProductRelationMapper.insert(entity);
        return entity;
    }

    private ProductRecord toRecord(ProductSpuEntity entity) {
        return new ProductRecord(
                entity.getId(),
                entity.getProductName(),
                entity.getOriginCountry(),
                entity.getSellingPoint(),
                entity.getSourceType(),
                entity.getSourceMerchantUserId(),
                entity.getAuditStatus(),
                Boolean.TRUE.equals(entity.getInPublicPool()),
                entity.getCreatedByUserId(),
                entity.getCreatedAt(),
                entity.getReviewedByUserId(),
                entity.getReviewedAt());
    }

    private MerchantProductRelation toRelationRecord(MerchantProductRelationEntity entity) {
        return new MerchantProductRelation(
                entity.getId(),
                entity.getMerchantUserId(),
                entity.getProductId(),
                entity.getSelectSource(),
                entity.getDistributionLink(),
                entity.getSelectedAt());
    }

    private PublicProductDetailRecord toPublicDetailRecord(ProductSpuEntity entity) {
        List<String> galleryImages = readStringList(entity.getGalleryImages());
        String mainImage = defaultString(entity.getMainImage());
        String thumbnailImage = defaultString(entity.getThumbnailImage());
        String boxImage = defaultString(entity.getBoxImage());

        return new PublicProductDetailRecord(
                entity.getId(),
                defaultString(entity.getProductName()),
                defaultString(entity.getProductCode()),
                defaultString(entity.getBrandName()),
                defaultString(entity.getOriginCountry()),
                defaultString(entity.getSellingPoint()),
                mainImage,
                thumbnailImage,
                boxImage,
                galleryImages,
                defaultString(entity.getBarcode()),
                defaultString(entity.getNetContent()),
                defaultString(entity.getCaseSpec()),
                entity.getPalletsPerContainer(),
                entity.getCasesPerPallet(),
                entity.getCasesPerContainer(),
                entity.getShelfLifeMonths(),
                defaultString(entity.getSizeCm()),
                defaultString(entity.getGrossWeightKg()),
                defaultString(entity.getIngredients()),
                entity.getStockQuantity() == null ? 0 : entity.getStockQuantity(),
                defaultDecimal(entity.getMemberPriceBronze()),
                defaultDecimal(entity.getMemberPriceSilver()),
                defaultDecimal(entity.getMemberPriceGold()),
                defaultDecimal(entity.getMemberPricePlatinum()),
                defaultDecimal(entity.getMemberPriceDiamond()),
                defaultDecimal(entity.getMemberPriceBlackDiamond()),
                defaultDecimal(entity.getRetailPrice()),
                defaultString(entity.getDetailHtml()),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    private List<String> readStringList(String jsonValue) {
        if (jsonValue == null || jsonValue.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(jsonValue, STRING_LIST_TYPE);
        } catch (Exception exception) {
            throw new BusinessException("商品图片数据解析失败");
        }
    }

    private BigDecimal defaultDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }

    public record ProductRecord(
            Long productId,
            String productName,
            String originCountry,
            String sellingPoint,
            String sourceType,
            Long sourceMerchantUserId,
            String auditStatus,
            boolean inPublicPool,
            Long createdByUserId,
            LocalDateTime createdAt,
            Long reviewedByUserId,
            LocalDateTime reviewedAt) {
    }

    public record PublicProductDetailRecord(
            Long productId,
            String productName,
            String productCode,
            String brandName,
            String originCountry,
            String sellingPoint,
            String mainImage,
            String thumbnailImage,
            String boxImage,
            List<String> galleryImages,
            String barcode,
            String netContent,
            String caseSpec,
            Integer palletsPerContainer,
            Integer casesPerPallet,
            Integer casesPerContainer,
            Integer shelfLifeMonths,
            String sizeCm,
            String grossWeightKg,
            String ingredients,
            int stockQuantity,
            BigDecimal memberPriceBronze,
            BigDecimal memberPriceSilver,
            BigDecimal memberPriceGold,
            BigDecimal memberPricePlatinum,
            BigDecimal memberPriceDiamond,
            BigDecimal memberPriceBlackDiamond,
            BigDecimal retailPrice,
            String detailHtml,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    public record MerchantProductRelation(
            Long relationId,
            Long merchantUserId,
            Long productId,
            String selectSource,
            String distributionLink,
            LocalDateTime selectedAt) {
    }

    public record MerchantProductView(
            MerchantProductRelation relation,
            ProductRecord product) {
    }
}
