package com.saimeng.admin.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

/**
 * 分销企业实体。
 */
@TableName("distributor_enterprise")
public class DistributorEnterpriseEntity {

    @TableId
    private Long id;
    private Long userId;
    private Long applicationId;
    private String enterpriseNo;
    private String sourceType;
    private String companyName;
    private String storeName;
    private String contactName;
    private String contactPhone;
    private String businessScope;
    private Boolean enabled;
    private String reviewRemark;
    private String memberLevelKey;
    private String profileSnapshotJson;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }
    public String getEnterpriseNo() { return enterpriseNo; }
    public void setEnterpriseNo(String enterpriseNo) { this.enterpriseNo = enterpriseNo; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getBusinessScope() { return businessScope; }
    public void setBusinessScope(String businessScope) { this.businessScope = businessScope; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public String getReviewRemark() { return reviewRemark; }
    public void setReviewRemark(String reviewRemark) { this.reviewRemark = reviewRemark; }
    public String getMemberLevelKey() { return memberLevelKey; }
    public void setMemberLevelKey(String memberLevelKey) { this.memberLevelKey = memberLevelKey; }
    public String getProfileSnapshotJson() { return profileSnapshotJson; }
    public void setProfileSnapshotJson(String profileSnapshotJson) { this.profileSnapshotJson = profileSnapshotJson; }
    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
