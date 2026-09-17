package com.saimeng.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.admin.entity.ProductCategoryEntity;
import com.saimeng.admin.mapper.ProductCategoryMapper;
import com.saimeng.common.BusinessException;
import com.saimeng.product.entity.ProductSpuEntity;
import com.saimeng.product.mapper.ProductSpuMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 运营后台商品库与分类管理服务。
 */
@Service
public class OperatorCatalogService {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final ProductCategoryMapper productCategoryMapper;
    private final ProductSpuMapper productSpuMapper;
    private final ObjectMapper objectMapper;

    public OperatorCatalogService(
            ProductCategoryMapper productCategoryMapper,
            ProductSpuMapper productSpuMapper,
            ObjectMapper objectMapper) {
        this.productCategoryMapper = productCategoryMapper;
        this.productSpuMapper = productSpuMapper;
        this.objectMapper = objectMapper;
    }

    public CatalogBootstrapPayload getBootstrap() {
        List<ProductCategoryEntity> categories = listCategoryEntities();
        Map<Long, ProductCategoryEntity> categoryMap = categories.stream()
                .collect(Collectors.toMap(ProductCategoryEntity::getId, entity -> entity));
        List<CategoryRecord> categoryRecords = categories.stream()
                .sorted(Comparator.comparing(ProductCategoryEntity::getSortOrder)
                        .thenComparing(ProductCategoryEntity::getCreatedAt))
                .map(entity -> toCategoryRecord(entity, categories))
                .toList();

        List<ProductRecord> productRecords = listProductEntities().stream()
                .sorted(Comparator.comparing(ProductSpuEntity::getUpdatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                        .reversed())
                .map(entity -> toProductRecord(entity, categoryMap))
                .toList();
        return new CatalogBootstrapPayload(categoryRecords, productRecords);
    }

    public ProductRecord getProduct(Long productId) {
        return toProductRecord(getRequiredProduct(productId), listCategoryMap());
    }

    @Transactional
    public CategoryRecord createCategory(CategoryUpsertRequest request) {
        validateCategoryRequest(request, null);
        ProductCategoryEntity entity = new ProductCategoryEntity();
        entity.setId(IdWorker.getId());
        applyCategoryValues(entity, request);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setDeleted(false);
        productCategoryMapper.insert(entity);
        return toCategoryRecord(entity, listCategoryEntities());
    }

    @Transactional
    public CategoryRecord updateCategory(Long categoryId, CategoryUpsertRequest request) {
        ProductCategoryEntity entity = getRequiredCategory(categoryId);
        validateCategoryRequest(request, categoryId);
        applyCategoryValues(entity, request);
        entity.setUpdatedAt(LocalDateTime.now());
        productCategoryMapper.updateById(entity);
        return toCategoryRecord(entity, listCategoryEntities());
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        ProductCategoryEntity entity = getRequiredCategory(categoryId);
        long childCount = productCategoryMapper.selectCount(new LambdaQueryWrapper<ProductCategoryEntity>()
                .eq(ProductCategoryEntity::getParentId, categoryId)
                .eq(ProductCategoryEntity::getDeleted, false));
        if (childCount > 0) {
            throw new BusinessException("当前分类下仍有子分类，无法删除");
        }
        long productCount = productSpuMapper.selectCount(new LambdaQueryWrapper<ProductSpuEntity>()
                .eq(ProductSpuEntity::getCategoryId, categoryId)
                .eq(ProductSpuEntity::getDeleted, false));
        if (productCount > 0) {
            throw new BusinessException("当前分类下仍有关联商品，无法删除");
        }
        entity.setDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
        productCategoryMapper.updateById(entity);
    }

    @Transactional
    public ProductRecord createProduct(Long operatorUserId, ProductUpsertRequest request) {
        validateProductRequest(request);
        ProductSpuEntity entity = new ProductSpuEntity();
        entity.setId(IdWorker.getId());
        entity.setCreatedByUserId(operatorUserId);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setReviewedByUserId(operatorUserId);
        entity.setReviewedAt(LocalDateTime.now());
        entity.setSourceType("PLATFORM");
        entity.setSourceMerchantUserId(null);
        entity.setAuditStatus("APPROVED");
        entity.setInPublicPool(true);
        entity.setDeleted(false);
        applyProductValues(entity, request);
        productSpuMapper.insert(entity);
        return toProductRecord(entity, listCategoryMap());
    }

    @Transactional
    public ProductRecord updateProduct(Long productId, ProductUpsertRequest request) {
        validateProductRequest(request);
        ProductSpuEntity entity = getRequiredProduct(productId);
        applyProductValues(entity, request);
        entity.setUpdatedAt(LocalDateTime.now());
        productSpuMapper.updateById(entity);
        return toProductRecord(entity, listCategoryMap());
    }

    @Transactional
    public void deleteProduct(Long productId) {
        ProductSpuEntity entity = getRequiredProduct(productId);
        entity.setDeleted(true);
        entity.setEnabled(false);
        entity.setUpdatedAt(LocalDateTime.now());
        productSpuMapper.updateById(entity);
    }

    private void validateCategoryRequest(CategoryUpsertRequest request, Long currentCategoryId) {
        if (request.parseParentId() != null) {
            if (Objects.equals(request.parseParentId(), currentCategoryId)) {
                throw new BusinessException("上级分类不能选择自己");
            }
            getRequiredCategory(request.parseParentId());
        }
    }

    private void validateProductRequest(ProductUpsertRequest request) {
        ProductCategoryEntity category = getRequiredCategory(request.parseCategoryId());
        boolean hasChildren = productCategoryMapper.selectCount(new LambdaQueryWrapper<ProductCategoryEntity>()
                .eq(ProductCategoryEntity::getParentId, category.getId())
                .eq(ProductCategoryEntity::getDeleted, false)) > 0;
        if (hasChildren) {
            throw new BusinessException("商品必须挂到末级分类，请选择最细分类");
        }
    }

    private void applyCategoryValues(ProductCategoryEntity entity, CategoryUpsertRequest request) {
        entity.setParentId(request.parseParentId());
        entity.setCategoryName(request.categoryName().trim());
        entity.setCategoryCode(request.categoryCode().trim());
        entity.setCategoryLevel(resolveCategoryLevel(request.parseParentId()));
        entity.setSortOrder(request.sortOrder());
        entity.setEnabled(request.enabled());
    }

    private int resolveCategoryLevel(Long parentId) {
        if (parentId == null) {
            return 1;
        }
        ProductCategoryEntity parent = getRequiredCategory(parentId);
        return parent.getCategoryLevel() + 1;
    }

    private void applyProductValues(ProductSpuEntity entity, ProductUpsertRequest request) {
        entity.setProductName(request.productName().trim());
        entity.setProductCode(request.productCode().trim());
        entity.setCategoryId(request.parseCategoryId());
        entity.setBrandName(request.brandName().trim());
        entity.setOriginCountry(request.originCountry().trim());
        entity.setSellingPoint(request.sellingPoint().trim());
        entity.setMainImage(request.mainImage());
        entity.setThumbnailImage(request.thumbnailImage());
        entity.setBoxImage(request.boxImage());
        entity.setGalleryImages(writeStringList(request.galleryImages()));
        entity.setBarcode(request.barcode().trim());
        entity.setNetContent(request.netContent().trim());
        entity.setCaseSpec(request.caseSpec().trim());
        entity.setPalletsPerContainer(request.palletsPerContainer());
        entity.setCasesPerPallet(request.casesPerPallet());
        entity.setCasesPerContainer(request.casesPerContainer());
        entity.setShelfLifeMonths(request.shelfLifeMonths());
        entity.setSizeCm(request.sizeCm().trim());
        entity.setGrossWeightKg(request.grossWeightKg().trim());
        entity.setIngredients(request.ingredients().trim());
        entity.setStockQuantity(request.stockQuantity());
        entity.setMemberPriceBronze(request.memberPriceBronze());
        entity.setMemberPriceSilver(request.memberPriceSilver());
        entity.setMemberPriceGold(request.memberPriceGold());
        entity.setMemberPricePlatinum(request.memberPricePlatinum());
        entity.setMemberPriceDiamond(request.memberPriceDiamond());
        entity.setMemberPriceBlackDiamond(request.memberPriceBlackDiamond());
        entity.setRetailPrice(request.retailPrice());
        entity.setDetailHtml(request.detailHtml());
        entity.setEnabled(request.enabled());
    }

    private ProductCategoryEntity getRequiredCategory(Long categoryId) {
        ProductCategoryEntity entity = productCategoryMapper.selectById(categoryId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("分类不存在");
        }
        return entity;
    }

    private ProductSpuEntity getRequiredProduct(Long productId) {
        ProductSpuEntity entity = productSpuMapper.selectById(productId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("商品不存在");
        }
        return entity;
    }

    private List<ProductCategoryEntity> listCategoryEntities() {
        return productCategoryMapper.selectList(new LambdaQueryWrapper<ProductCategoryEntity>()
                .eq(ProductCategoryEntity::getDeleted, false));
    }

    private List<ProductSpuEntity> listProductEntities() {
        return productSpuMapper.selectList(new LambdaQueryWrapper<ProductSpuEntity>()
                .eq(ProductSpuEntity::getDeleted, false));
    }

    private Map<Long, ProductCategoryEntity> listCategoryMap() {
        return listCategoryEntities().stream()
                .collect(Collectors.toMap(ProductCategoryEntity::getId, entity -> entity));
    }

    private CategoryRecord toCategoryRecord(ProductCategoryEntity entity, List<ProductCategoryEntity> allCategories) {
        boolean hasChildren = allCategories.stream()
                .anyMatch(category -> Objects.equals(category.getParentId(), entity.getId())
                        && !Boolean.TRUE.equals(category.getDeleted()));
        return new CategoryRecord(
                String.valueOf(entity.getId()),
                entity.getParentId() == null ? null : String.valueOf(entity.getParentId()),
                entity.getCategoryName(),
                entity.getCategoryCode(),
                entity.getCategoryLevel(),
                entity.getSortOrder(),
                Boolean.TRUE.equals(entity.getEnabled()),
                !hasChildren,
                buildCategoryPathNames(entity, allCategories),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    private ProductRecord toProductRecord(ProductSpuEntity entity, Map<Long, ProductCategoryEntity> categoryMap) {
        return new ProductRecord(
                String.valueOf(entity.getId()),
                entity.getProductName(),
                defaultString(entity.getProductCode()),
                entity.getCategoryId() == null ? null : String.valueOf(entity.getCategoryId()),
                resolveCategoryName(entity.getCategoryId(), categoryMap),
                resolveCategoryPathNames(entity.getCategoryId(), categoryMap),
                defaultString(entity.getBrandName()),
                defaultString(entity.getOriginCountry()),
                defaultString(entity.getSellingPoint()),
                defaultString(entity.getMainImage()),
                defaultString(entity.getThumbnailImage()),
                defaultString(entity.getBoxImage()),
                readStringList(entity.getGalleryImages()),
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
                entity.getSourceType(),
                entity.getAuditStatus(),
                Boolean.TRUE.equals(entity.getInPublicPool()),
                Boolean.TRUE.equals(entity.getEnabled()),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    private List<String> buildCategoryPathNames(ProductCategoryEntity entity, List<ProductCategoryEntity> allCategories) {
        Map<Long, ProductCategoryEntity> categoryMap = allCategories.stream()
                .collect(Collectors.toMap(ProductCategoryEntity::getId, item -> item));
        return resolveCategoryPathNames(entity.getId(), categoryMap);
    }

    private String resolveCategoryName(Long categoryId, Map<Long, ProductCategoryEntity> categoryMap) {
        if (categoryId == null) {
            return "";
        }
        ProductCategoryEntity category = categoryMap.get(categoryId);
        return category == null ? "" : category.getCategoryName();
    }

    private List<String> resolveCategoryPathNames(Long categoryId, Map<Long, ProductCategoryEntity> categoryMap) {
        if (categoryId == null) {
            return List.of();
        }
        List<String> pathNames = new ArrayList<>();
        ProductCategoryEntity current = categoryMap.get(categoryId);
        while (current != null) {
            pathNames.add(0, current.getCategoryName());
            current = current.getParentId() == null ? null : categoryMap.get(current.getParentId());
        }
        return pathNames;
    }

    private BigDecimal defaultDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
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

    private String writeStringList(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? List.of() : values);
        } catch (Exception exception) {
            throw new BusinessException("商品图片数据保存失败");
        }
    }

    public record CatalogBootstrapPayload(
            List<CategoryRecord> categories,
            List<ProductRecord> products) {
    }

    public record CategoryRecord(
            String id,
            String parentId,
            String categoryName,
            String categoryCode,
            int categoryLevel,
            int sortOrder,
            boolean enabled,
            boolean leaf,
            List<String> pathNames,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    public record ProductRecord(
            String id,
            String productName,
            String productCode,
            String categoryId,
            String categoryName,
            List<String> categoryPathNames,
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
            String sourceType,
            String auditStatus,
            boolean inPublicPool,
            boolean enabled,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    public record CategoryUpsertRequest(
            String parentId,
            @NotBlank(message = "分类名称不能为空") String categoryName,
            @NotBlank(message = "分类编码不能为空") String categoryCode,
            @NotNull(message = "排序值不能为空") Integer sortOrder,
            @NotNull(message = "启用状态不能为空") Boolean enabled) {
        public Long parseParentId() {
            if (parentId == null || parentId.isBlank()) {
                return null;
            }
            return Long.parseLong(parentId);
        }
    }

    public record ProductUpsertRequest(
            @NotBlank(message = "商品名称不能为空") String productName,
            @NotBlank(message = "商品编码不能为空") String productCode,
            @NotBlank(message = "分类不能为空") String categoryId,
            @NotBlank(message = "品牌名称不能为空") String brandName,
            @NotBlank(message = "原产国不能为空") String originCountry,
            @NotBlank(message = "商品卖点不能为空") String sellingPoint,
            String mainImage,
            String thumbnailImage,
            String boxImage,
            List<String> galleryImages,
            @NotBlank(message = "条形码不能为空") String barcode,
            @NotBlank(message = "净含量不能为空") String netContent,
            @NotBlank(message = "箱规不能为空") String caseSpec,
            @NotNull(message = "每柜托数不能为空") Integer palletsPerContainer,
            @NotNull(message = "每托箱数不能为空") Integer casesPerPallet,
            @NotNull(message = "每柜箱数不能为空") Integer casesPerContainer,
            @NotNull(message = "保质期不能为空") Integer shelfLifeMonths,
            @NotBlank(message = "尺寸不能为空") String sizeCm,
            @NotBlank(message = "毛重不能为空") String grossWeightKg,
            @NotBlank(message = "配料不能为空") String ingredients,
            @NotNull(message = "库存不能为空") Integer stockQuantity,
            @NotNull(message = "青铜价不能为空") BigDecimal memberPriceBronze,
            @NotNull(message = "白银价不能为空") BigDecimal memberPriceSilver,
            @NotNull(message = "黄金价不能为空") BigDecimal memberPriceGold,
            @NotNull(message = "铂金价不能为空") BigDecimal memberPricePlatinum,
            @NotNull(message = "钻石价不能为空") BigDecimal memberPriceDiamond,
            @NotNull(message = "黑钻价不能为空") BigDecimal memberPriceBlackDiamond,
            @NotNull(message = "零售价不能为空") BigDecimal retailPrice,
            String detailHtml,
            @NotNull(message = "启用状态不能为空") Boolean enabled) {
        public Long parseCategoryId() {
            return Long.parseLong(categoryId);
        }
    }
}
