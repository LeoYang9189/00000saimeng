package com.saimeng.admin.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 客户分层画像快照实体。
 */
@TableName("customer_portrait_snapshot")
public class CustomerPortraitSnapshotEntity {

    @TableId
    private Long id;
    private Long userId;
    private Long enterpriseId;
    private String segmentCode;
    private String segmentName;
    private String primaryCategories;
    private BigDecimal pickupFrequencyPerMonth;
    private BigDecimal avgOrderAmount;
    private Integer repaymentDays;
    private String recommendedPolicy;
    private String policyTags;
    private String externalDataStatus;
    private String externalDataEndpoint;
    private LocalDateTime lastSyncedAt;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getEnterpriseId() { return enterpriseId; }
    public void setEnterpriseId(Long enterpriseId) { this.enterpriseId = enterpriseId; }
    public String getSegmentCode() { return segmentCode; }
    public void setSegmentCode(String segmentCode) { this.segmentCode = segmentCode; }
    public String getSegmentName() { return segmentName; }
    public void setSegmentName(String segmentName) { this.segmentName = segmentName; }
    public String getPrimaryCategories() { return primaryCategories; }
    public void setPrimaryCategories(String primaryCategories) { this.primaryCategories = primaryCategories; }
    public BigDecimal getPickupFrequencyPerMonth() { return pickupFrequencyPerMonth; }
    public void setPickupFrequencyPerMonth(BigDecimal pickupFrequencyPerMonth) { this.pickupFrequencyPerMonth = pickupFrequencyPerMonth; }
    public BigDecimal getAvgOrderAmount() { return avgOrderAmount; }
    public void setAvgOrderAmount(BigDecimal avgOrderAmount) { this.avgOrderAmount = avgOrderAmount; }
    public Integer getRepaymentDays() { return repaymentDays; }
    public void setRepaymentDays(Integer repaymentDays) { this.repaymentDays = repaymentDays; }
    public String getRecommendedPolicy() { return recommendedPolicy; }
    public void setRecommendedPolicy(String recommendedPolicy) { this.recommendedPolicy = recommendedPolicy; }
    public String getPolicyTags() { return policyTags; }
    public void setPolicyTags(String policyTags) { this.policyTags = policyTags; }
    public String getExternalDataStatus() { return externalDataStatus; }
    public void setExternalDataStatus(String externalDataStatus) { this.externalDataStatus = externalDataStatus; }
    public String getExternalDataEndpoint() { return externalDataEndpoint; }
    public void setExternalDataEndpoint(String externalDataEndpoint) { this.externalDataEndpoint = externalDataEndpoint; }
    public LocalDateTime getLastSyncedAt() { return lastSyncedAt; }
    public void setLastSyncedAt(LocalDateTime lastSyncedAt) { this.lastSyncedAt = lastSyncedAt; }
    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
