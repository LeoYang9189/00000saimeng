package com.saimeng.merchant;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.saimeng.common.BusinessException;
import com.saimeng.member.RealNameAuthService;
import com.saimeng.merchant.entity.MerchantApplicationEntity;
import com.saimeng.merchant.mapper.MerchantApplicationMapper;
import com.saimeng.system.RoleCodes;
import com.saimeng.system.UserAccountService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 分销商入驻申请服务。
 */
@Service
public class MerchantApplicationService {

    private final MerchantApplicationMapper merchantApplicationMapper;
    private final UserAccountService userAccountService;
    private final RealNameAuthService realNameAuthService;

    public MerchantApplicationService(
            MerchantApplicationMapper merchantApplicationMapper,
            UserAccountService userAccountService,
            RealNameAuthService realNameAuthService) {
        this.merchantApplicationMapper = merchantApplicationMapper;
        this.userAccountService = userAccountService;
        this.realNameAuthService = realNameAuthService;
    }

    /**
     * 提交分销商申请。
     *
     * @param userId 用户 ID
     * @param storeName 店铺名称
     * @param companyName 公司名称
     * @param contactName 联系人
     * @param businessScope 经营说明
     * @return 申请记录
     */
    @Transactional
    public MerchantApplicationRecord submit(
            Long userId,
            String storeName,
            String companyName,
            String contactName,
            String businessScope) {
        RealNameAuthService.RealNameAuthRecord authRecord = realNameAuthService.getCurrentRecord(userId);
        if (authRecord == null || !"APPROVED".equals(authRecord.status())) {
            throw new BusinessException("请先完成实名认证并审核通过");
        }
        MerchantApplicationEntity entity = findByUserId(userId);
        if (entity != null && "APPROVED".equals(entity.getStatus())) {
            throw new BusinessException("经销商企业认证已通过");
        }
        if (entity == null) {
            entity = new MerchantApplicationEntity();
            entity.setId(IdWorker.getId());
            entity.setUserId(userId);
        }
        entity.setStoreName(storeName);
        entity.setCompanyName(companyName);
        entity.setContactName(contactName);
        entity.setBusinessScope(businessScope);
        entity.setStatus("PENDING");
        entity.setReviewRemark(null);
        entity.setSubmittedAt(LocalDateTime.now());
        entity.setReviewedAt(null);
        if (merchantApplicationMapper.selectById(entity.getId()) == null) {
            merchantApplicationMapper.insert(entity);
        } else {
            merchantApplicationMapper.updateById(entity);
        }
        return toRecord(entity);
    }

    /**
     * 查询当前用户申请。
     *
     * @param userId 用户 ID
     * @return 申请记录
     */
    public MerchantApplicationRecord getCurrentApplication(Long userId) {
        MerchantApplicationEntity entity = findByUserId(userId);
        return entity == null ? null : toRecord(entity);
    }

    /**
     * 查询全部申请。
     *
     * @return 申请列表
     */
    public List<MerchantApplicationRecord> listAll() {
        return merchantApplicationMapper.selectList(null).stream()
                .map(this::toRecord)
                .sorted(Comparator.comparing(MerchantApplicationRecord::submittedAt).reversed())
                .toList();
    }

    /**
     * 审核通过分销商申请。
     *
     * @param applicationId 申请 ID
     * @return 审核结果
     */
    @Transactional
    public MerchantApplicationRecord approve(Long applicationId) {
        MerchantApplicationEntity entity = getRequired(applicationId);
        entity.setStatus("APPROVED");
        entity.setReviewRemark(null);
        entity.setReviewedAt(LocalDateTime.now());
        merchantApplicationMapper.updateById(entity);
        userAccountService.addRole(entity.getUserId(), RoleCodes.DISTRIBUTOR);
        return toRecord(entity);
    }

    /**
     * 驳回分销商申请。
     *
     * @param applicationId 申请 ID
     * @param remark 驳回原因
     * @return 审核结果
     */
    @Transactional
    public MerchantApplicationRecord reject(Long applicationId, String remark) {
        MerchantApplicationEntity entity = getRequired(applicationId);
        entity.setStatus("REJECTED");
        entity.setReviewRemark(remark);
        entity.setReviewedAt(LocalDateTime.now());
        merchantApplicationMapper.updateById(entity);
        return toRecord(entity);
    }

    private MerchantApplicationEntity findByUserId(Long userId) {
        return merchantApplicationMapper.selectOne(new LambdaQueryWrapper<MerchantApplicationEntity>()
                .eq(MerchantApplicationEntity::getUserId, userId)
                .last("limit 1"));
    }

    private MerchantApplicationEntity getRequired(Long applicationId) {
        MerchantApplicationEntity entity = merchantApplicationMapper.selectById(applicationId);
        if (entity == null) {
            throw new BusinessException("经销商企业认证申请不存在");
        }
        return entity;
    }

    private MerchantApplicationRecord toRecord(MerchantApplicationEntity entity) {
        return new MerchantApplicationRecord(
                entity.getId(),
                entity.getUserId(),
                entity.getStoreName(),
                entity.getCompanyName(),
                entity.getContactName(),
                entity.getBusinessScope(),
                entity.getStatus(),
                entity.getReviewRemark(),
                entity.getSubmittedAt(),
                entity.getReviewedAt());
    }

    public record MerchantApplicationRecord(
            Long applicationId,
            Long userId,
            String storeName,
            String companyName,
            String contactName,
            String businessScope,
            String status,
            String reviewRemark,
            LocalDateTime submittedAt,
            LocalDateTime reviewedAt) {
    }
}
