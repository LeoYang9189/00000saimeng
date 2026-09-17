package com.saimeng.product.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

/**
 * 商品主档实体。
 */
@TableName("product_spu")
public class ProductSpuEntity {

    @TableId
    private Long id;
    private String productName;
    private String productCode;
    private Long categoryId;
    private String brandName;
    private String originCountry;
    private String sellingPoint;
    private String mainImage;
    private String thumbnailImage;
    private String boxImage;
    private String galleryImages;
    private String barcode;
    private String netContent;
    private String caseSpec;
    private Integer palletsPerContainer;
    private Integer casesPerPallet;
    private Integer casesPerContainer;
    private Integer shelfLifeMonths;
    private String sizeCm;
    private String grossWeightKg;
    private String ingredients;
    private Integer stockQuantity;
    private java.math.BigDecimal memberPriceBronze;
    private java.math.BigDecimal memberPriceSilver;
    private java.math.BigDecimal memberPriceGold;
    private java.math.BigDecimal memberPricePlatinum;
    private java.math.BigDecimal memberPriceDiamond;
    private java.math.BigDecimal memberPriceBlackDiamond;
    private java.math.BigDecimal retailPrice;
    private String detailHtml;
    private String sourceType;
    private Long sourceMerchantUserId;
    private String auditStatus;
    private Boolean inPublicPool;
    private Boolean enabled;
    private Boolean deleted;
    private Long createdByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long reviewedByUserId;
    private LocalDateTime reviewedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public String getOriginCountry() {
        return originCountry;
    }

    public void setOriginCountry(String originCountry) {
        this.originCountry = originCountry;
    }

    public String getSellingPoint() {
        return sellingPoint;
    }

    public void setSellingPoint(String sellingPoint) {
        this.sellingPoint = sellingPoint;
    }

    public String getMainImage() {
        return mainImage;
    }

    public void setMainImage(String mainImage) {
        this.mainImage = mainImage;
    }

    public String getThumbnailImage() {
        return thumbnailImage;
    }

    public void setThumbnailImage(String thumbnailImage) {
        this.thumbnailImage = thumbnailImage;
    }

    public String getBoxImage() {
        return boxImage;
    }

    public void setBoxImage(String boxImage) {
        this.boxImage = boxImage;
    }

    public String getGalleryImages() {
        return galleryImages;
    }

    public void setGalleryImages(String galleryImages) {
        this.galleryImages = galleryImages;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public String getNetContent() {
        return netContent;
    }

    public void setNetContent(String netContent) {
        this.netContent = netContent;
    }

    public String getCaseSpec() {
        return caseSpec;
    }

    public void setCaseSpec(String caseSpec) {
        this.caseSpec = caseSpec;
    }

    public Integer getPalletsPerContainer() {
        return palletsPerContainer;
    }

    public void setPalletsPerContainer(Integer palletsPerContainer) {
        this.palletsPerContainer = palletsPerContainer;
    }

    public Integer getCasesPerPallet() {
        return casesPerPallet;
    }

    public void setCasesPerPallet(Integer casesPerPallet) {
        this.casesPerPallet = casesPerPallet;
    }

    public Integer getCasesPerContainer() {
        return casesPerContainer;
    }

    public void setCasesPerContainer(Integer casesPerContainer) {
        this.casesPerContainer = casesPerContainer;
    }

    public Integer getShelfLifeMonths() {
        return shelfLifeMonths;
    }

    public void setShelfLifeMonths(Integer shelfLifeMonths) {
        this.shelfLifeMonths = shelfLifeMonths;
    }

    public String getSizeCm() {
        return sizeCm;
    }

    public void setSizeCm(String sizeCm) {
        this.sizeCm = sizeCm;
    }

    public String getGrossWeightKg() {
        return grossWeightKg;
    }

    public void setGrossWeightKg(String grossWeightKg) {
        this.grossWeightKg = grossWeightKg;
    }

    public String getIngredients() {
        return ingredients;
    }

    public void setIngredients(String ingredients) {
        this.ingredients = ingredients;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public java.math.BigDecimal getMemberPriceBronze() {
        return memberPriceBronze;
    }

    public void setMemberPriceBronze(java.math.BigDecimal memberPriceBronze) {
        this.memberPriceBronze = memberPriceBronze;
    }

    public java.math.BigDecimal getMemberPriceSilver() {
        return memberPriceSilver;
    }

    public void setMemberPriceSilver(java.math.BigDecimal memberPriceSilver) {
        this.memberPriceSilver = memberPriceSilver;
    }

    public java.math.BigDecimal getMemberPriceGold() {
        return memberPriceGold;
    }

    public void setMemberPriceGold(java.math.BigDecimal memberPriceGold) {
        this.memberPriceGold = memberPriceGold;
    }

    public java.math.BigDecimal getMemberPricePlatinum() {
        return memberPricePlatinum;
    }

    public void setMemberPricePlatinum(java.math.BigDecimal memberPricePlatinum) {
        this.memberPricePlatinum = memberPricePlatinum;
    }

    public java.math.BigDecimal getMemberPriceDiamond() {
        return memberPriceDiamond;
    }

    public void setMemberPriceDiamond(java.math.BigDecimal memberPriceDiamond) {
        this.memberPriceDiamond = memberPriceDiamond;
    }

    public java.math.BigDecimal getMemberPriceBlackDiamond() {
        return memberPriceBlackDiamond;
    }

    public void setMemberPriceBlackDiamond(java.math.BigDecimal memberPriceBlackDiamond) {
        this.memberPriceBlackDiamond = memberPriceBlackDiamond;
    }

    public java.math.BigDecimal getRetailPrice() {
        return retailPrice;
    }

    public void setRetailPrice(java.math.BigDecimal retailPrice) {
        this.retailPrice = retailPrice;
    }

    public String getDetailHtml() {
        return detailHtml;
    }

    public void setDetailHtml(String detailHtml) {
        this.detailHtml = detailHtml;
    }

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }

    public Long getSourceMerchantUserId() {
        return sourceMerchantUserId;
    }

    public void setSourceMerchantUserId(Long sourceMerchantUserId) {
        this.sourceMerchantUserId = sourceMerchantUserId;
    }

    public String getAuditStatus() {
        return auditStatus;
    }

    public void setAuditStatus(String auditStatus) {
        this.auditStatus = auditStatus;
    }

    public Boolean getInPublicPool() {
        return inPublicPool;
    }

    public void setInPublicPool(Boolean inPublicPool) {
        this.inPublicPool = inPublicPool;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Boolean getDeleted() {
        return deleted;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getReviewedByUserId() {
        return reviewedByUserId;
    }

    public void setReviewedByUserId(Long reviewedByUserId) {
        this.reviewedByUserId = reviewedByUserId;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
