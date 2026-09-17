package com.saimeng.product.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

/**
 * 分销商商品关系实体。
 */
@TableName("merchant_product_relation")
public class MerchantProductRelationEntity {

    @TableId
    private Long id;
    private Long merchantUserId;
    private Long productId;
    private String selectSource;
    private String distributionLink;
    private LocalDateTime selectedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMerchantUserId() {
        return merchantUserId;
    }

    public void setMerchantUserId(Long merchantUserId) {
        this.merchantUserId = merchantUserId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getSelectSource() {
        return selectSource;
    }

    public void setSelectSource(String selectSource) {
        this.selectSource = selectSource;
    }

    public String getDistributionLink() {
        return distributionLink;
    }

    public void setDistributionLink(String distributionLink) {
        this.distributionLink = distributionLink;
    }

    public LocalDateTime getSelectedAt() {
        return selectedAt;
    }

    public void setSelectedAt(LocalDateTime selectedAt) {
        this.selectedAt = selectedAt;
    }
}
