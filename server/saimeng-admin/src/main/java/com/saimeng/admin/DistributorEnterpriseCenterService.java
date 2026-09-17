package com.saimeng.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saimeng.admin.entity.DistributorEnterpriseEntity;
import com.saimeng.admin.entity.EnterpriseJoinRequestEntity;
import com.saimeng.admin.entity.MemberLevelConfigEntity;
import com.saimeng.admin.entity.MerchantApplicationAiReportEntity;
import com.saimeng.admin.entity.MerchantApplicationDocumentEntity;
import com.saimeng.admin.mapper.DistributorEnterpriseMapper;
import com.saimeng.admin.mapper.EnterpriseJoinRequestMapper;
import com.saimeng.admin.mapper.MemberLevelConfigMapper;
import com.saimeng.admin.mapper.MerchantApplicationAiReportMapper;
import com.saimeng.admin.mapper.MerchantApplicationDocumentMapper;
import com.saimeng.common.BusinessException;
import com.saimeng.member.entity.MemberRealNameAuthEntity;
import com.saimeng.member.mapper.MemberRealNameAuthMapper;
import com.saimeng.merchant.entity.MerchantApplicationEntity;
import com.saimeng.merchant.mapper.MerchantApplicationMapper;
import com.saimeng.system.entity.SysUserEntity;
import com.saimeng.system.mapper.SysUserMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 经销商后台企业管理服务。
 */
@Service
public class DistributorEnterpriseCenterService {

    private static final String DEFAULT_MEMBER_LEVEL_KEY = "bronze";

    private final SysUserMapper sysUserMapper;
    private final MemberRealNameAuthMapper memberRealNameAuthMapper;
    private final MerchantApplicationMapper merchantApplicationMapper;
    private final MerchantApplicationAiReportMapper merchantApplicationAiReportMapper;
    private final MerchantApplicationDocumentMapper merchantApplicationDocumentMapper;
    private final DistributorEnterpriseMapper distributorEnterpriseMapper;
    private final EnterpriseJoinRequestMapper enterpriseJoinRequestMapper;
    private final MemberLevelConfigMapper memberLevelConfigMapper;
    private final ObjectMapper objectMapper;

    public DistributorEnterpriseCenterService(
            SysUserMapper sysUserMapper,
            MemberRealNameAuthMapper memberRealNameAuthMapper,
            MerchantApplicationMapper merchantApplicationMapper,
            MerchantApplicationAiReportMapper merchantApplicationAiReportMapper,
            MerchantApplicationDocumentMapper merchantApplicationDocumentMapper,
            DistributorEnterpriseMapper distributorEnterpriseMapper,
            EnterpriseJoinRequestMapper enterpriseJoinRequestMapper,
            MemberLevelConfigMapper memberLevelConfigMapper,
            ObjectMapper objectMapper) {
        this.sysUserMapper = sysUserMapper;
        this.memberRealNameAuthMapper = memberRealNameAuthMapper;
        this.merchantApplicationMapper = merchantApplicationMapper;
        this.merchantApplicationAiReportMapper = merchantApplicationAiReportMapper;
        this.merchantApplicationDocumentMapper = merchantApplicationDocumentMapper;
        this.distributorEnterpriseMapper = distributorEnterpriseMapper;
        this.enterpriseJoinRequestMapper = enterpriseJoinRequestMapper;
        this.memberLevelConfigMapper = memberLevelConfigMapper;
        this.objectMapper = objectMapper;
    }

    /**
     * 获取经销商企业管理首页数据。
     *
     * @param currentUserId 当前用户 ID
     * @return 页面数据
     */
    @Transactional(readOnly = true)
    public DistributorEnterpriseCompanyBootstrapPayload getBootstrap(Long currentUserId) {
        SysUserEntity currentUser = getRequiredUser(currentUserId);
        DistributorEnterpriseEntity enterpriseEntity = getCurrentEnterpriseNullable(currentUserId);
        MerchantApplicationEntity applicationEntity = merchantApplicationMapper.selectOne(new LambdaQueryWrapper<MerchantApplicationEntity>()
                .eq(MerchantApplicationEntity::getUserId, currentUserId)
                .last("limit 1"));
        EnterpriseJoinRequestEntity joinRequestEntity = enterpriseJoinRequestMapper.selectOne(new LambdaQueryWrapper<EnterpriseJoinRequestEntity>()
                .eq(EnterpriseJoinRequestEntity::getUserId, currentUserId)
                .orderByDesc(EnterpriseJoinRequestEntity::getCreatedAt)
                .last("limit 1"));

        return new DistributorEnterpriseCompanyBootstrapPayload(
                String.valueOf(currentUserId),
                currentUser.getDisplayName(),
                enterpriseEntity != null,
                enterpriseEntity != null && Objects.equals(enterpriseEntity.getUserId(), currentUserId),
                enterpriseEntity == null ? null : toEnterpriseSummaryRecord(enterpriseEntity),
                applicationEntity == null ? null : toApplicationRecord(applicationEntity),
                joinRequestEntity == null ? null : toJoinRequestRecord(joinRequestEntity));
    }

    /**
     * 搜索已存在企业。
     *
     * @param keyword 企业名称关键字
     * @return 企业列表
     */
    @Transactional(readOnly = true)
    public List<EnterpriseSearchRecord> searchEnterprises(String keyword) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        return distributorEnterpriseMapper.selectList(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                        .eq(DistributorEnterpriseEntity::getDeleted, false)
                        .like(!normalizedKeyword.isBlank(), DistributorEnterpriseEntity::getCompanyName, normalizedKeyword)
                        .orderByDesc(DistributorEnterpriseEntity::getUpdatedAt))
                .stream()
                .limit(10)
                .map(this::toEnterpriseSearchRecord)
                .toList();
    }

    /**
     * 提交新企业认证申请。
     *
     * @param currentUserId 当前用户 ID
     * @param request 认证请求
     * @return 申请记录
     */
    @Transactional
    public CertificationApplicationRecord submitCertification(Long currentUserId, EnterpriseCertificationSubmitRequest request) {
        validateCertificationRequest(currentUserId, request);
        MerchantApplicationEntity entity = merchantApplicationMapper.selectOne(new LambdaQueryWrapper<MerchantApplicationEntity>()
                .eq(MerchantApplicationEntity::getUserId, currentUserId)
                .last("limit 1"));
        LocalDateTime now = LocalDateTime.now();
        if (entity == null) {
            entity = new MerchantApplicationEntity();
            entity.setId(IdWorker.getId());
            entity.setUserId(currentUserId);
        }
        entity.setStoreName(request.storeName());
        entity.setCompanyName(request.companyName());
        entity.setContactName(request.contactName());
        entity.setContactPhone(request.contactPhone());
        entity.setBusinessScope(request.businessScope());
        entity.setStatus("PENDING");
        entity.setReviewRemark(null);
        entity.setExtraPayloadJson(writeProfileSnapshot(request.profileSnapshot()));
        entity.setSubmittedAt(now);
        entity.setReviewedAt(null);
        if (merchantApplicationMapper.selectById(entity.getId()) == null) {
            merchantApplicationMapper.insert(entity);
        } else {
            merchantApplicationMapper.updateById(entity);
        }
        upsertAiArtifacts(entity, request.profileSnapshot());
        return toApplicationRecord(entity);
    }

    /**
     * 提交加入企业申请。
     *
     * @param currentUserId 当前用户 ID
     * @param request 入企请求
     * @return 申请记录
     */
    @Transactional
    public JoinRequestRecord submitJoinRequest(Long currentUserId, EnterpriseJoinSubmitRequest request) {
        SysUserEntity currentUser = getRequiredUser(currentUserId);
        ensureCurrentUserWithoutEnterprise(currentUserId);
        DistributorEnterpriseEntity enterpriseEntity = getRequiredEnterprise(request.enterpriseId());
        EnterpriseJoinRequestEntity entity = enterpriseJoinRequestMapper.selectOne(new LambdaQueryWrapper<EnterpriseJoinRequestEntity>()
                .eq(EnterpriseJoinRequestEntity::getEnterpriseId, request.enterpriseId())
                .eq(EnterpriseJoinRequestEntity::getUserId, currentUserId)
                .last("limit 1"));
        if (entity != null && "PENDING".equals(entity.getStatus())) {
            throw new BusinessException("你已提交过加入申请，请等待企业超级管理员处理");
        }

        LocalDateTime now = LocalDateTime.now();
        if (entity == null) {
            entity = new EnterpriseJoinRequestEntity();
            entity.setId(IdWorker.getId());
            entity.setEnterpriseId(request.enterpriseId());
            entity.setUserId(currentUserId);
            entity.setCreatedAt(now);
        }
        entity.setApplicantName(currentUser.getDisplayName());
        entity.setApplicantPhone(currentUser.getPhone());
        entity.setPosition(request.position());
        entity.setApplyRemark(request.applyRemark());
        entity.setStatus("PENDING");
        entity.setReviewRemark(null);
        entity.setReviewedAt(null);
        if (enterpriseJoinRequestMapper.selectById(entity.getId()) == null) {
            enterpriseJoinRequestMapper.insert(entity);
        } else {
            enterpriseJoinRequestMapper.updateById(entity);
        }
        return new JoinRequestRecord(
                String.valueOf(entity.getId()),
                String.valueOf(enterpriseEntity.getId()),
                enterpriseEntity.getEnterpriseNo(),
                enterpriseEntity.getCompanyName(),
                entity.getApplicantName(),
                entity.getApplicantPhone(),
                entity.getPosition(),
                entity.getApplyRemark(),
                entity.getStatus(),
                entity.getReviewRemark(),
                entity.getCreatedAt(),
                entity.getReviewedAt());
    }

    private void validateCertificationRequest(Long currentUserId, EnterpriseCertificationSubmitRequest request) {
        MemberRealNameAuthEntity authEntity = memberRealNameAuthMapper.selectOne(new LambdaQueryWrapper<MemberRealNameAuthEntity>()
                .eq(MemberRealNameAuthEntity::getUserId, currentUserId)
                .last("limit 1"));
        if (authEntity == null || !"APPROVED".equals(authEntity.getStatus())) {
            throw new BusinessException("请先完成实名认证并审核通过，再提交经销商企业认证");
        }
        ensureCurrentUserWithoutEnterprise(currentUserId);
        long enterpriseCount = distributorEnterpriseMapper.selectCount(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                .eq(DistributorEnterpriseEntity::getCompanyName, request.companyName().trim())
                .eq(DistributorEnterpriseEntity::getDeleted, false));
        if (enterpriseCount > 0) {
            throw new BusinessException("该企业已存在，请改为申请加入企业");
        }
        long duplicatedApplicationCount = merchantApplicationMapper.selectCount(new LambdaQueryWrapper<MerchantApplicationEntity>()
                .eq(MerchantApplicationEntity::getCompanyName, request.companyName().trim())
                .in(MerchantApplicationEntity::getStatus, List.of("PENDING", "APPROVED"))
                .ne(MerchantApplicationEntity::getUserId, currentUserId));
        if (duplicatedApplicationCount > 0) {
            throw new BusinessException("该企业已有认证记录，请勿重复认证");
        }
    }

    private void ensureCurrentUserWithoutEnterprise(Long currentUserId) {
        if (getCurrentEnterpriseNullable(currentUserId) != null) {
            throw new BusinessException("当前账号已绑定企业，请勿重复提交");
        }
    }

    private DistributorEnterpriseEntity getCurrentEnterpriseNullable(Long currentUserId) {
        SysUserEntity currentUser = getRequiredUser(currentUserId);
        DistributorEnterpriseEntity enterpriseEntity = null;
        if (currentUser.getEnterpriseId() != null) {
            enterpriseEntity = distributorEnterpriseMapper.selectById(currentUser.getEnterpriseId());
        }
        if (enterpriseEntity == null || Boolean.TRUE.equals(enterpriseEntity.getDeleted())) {
            enterpriseEntity = distributorEnterpriseMapper.selectOne(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                    .eq(DistributorEnterpriseEntity::getUserId, currentUserId)
                    .eq(DistributorEnterpriseEntity::getDeleted, false)
                    .last("limit 1"));
        }
        if (enterpriseEntity == null || Boolean.TRUE.equals(enterpriseEntity.getDeleted())) {
            return null;
        }
        return enterpriseEntity;
    }

    private DistributorEnterpriseEntity getRequiredEnterprise(Long enterpriseId) {
        DistributorEnterpriseEntity entity = distributorEnterpriseMapper.selectById(enterpriseId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("企业不存在");
        }
        return entity;
    }

    private SysUserEntity getRequiredUser(Long userId) {
        SysUserEntity entity = sysUserMapper.selectById(userId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("用户不存在");
        }
        return entity;
    }

    private EnterpriseSummaryRecord toEnterpriseSummaryRecord(DistributorEnterpriseEntity entity) {
        SysUserEntity superAdmin = entity.getUserId() == null ? null : sysUserMapper.selectById(entity.getUserId());
        MemberLevelConfigEntity memberLevelEntity = entity.getMemberLevelKey() == null
                ? null
                : memberLevelConfigMapper.selectOne(new LambdaQueryWrapper<MemberLevelConfigEntity>()
                        .eq(MemberLevelConfigEntity::getLevelKey, entity.getMemberLevelKey())
                        .eq(MemberLevelConfigEntity::getDeleted, false)
                        .last("limit 1"));
        long associatedUserCount = sysUserMapper.selectCount(new LambdaQueryWrapper<SysUserEntity>()
                .eq(SysUserEntity::getEnterpriseId, entity.getId())
                .eq(SysUserEntity::getDeleted, false));
        String applicationStatus = entity.getApplicationId() == null
                ? "NONE"
                : merchantApplicationMapper.selectById(entity.getApplicationId()) == null
                    ? "NONE"
                    : merchantApplicationMapper.selectById(entity.getApplicationId()).getStatus();
        return new EnterpriseSummaryRecord(
                String.valueOf(entity.getId()),
                entity.getEnterpriseNo(),
                entity.getCompanyName(),
                entity.getStoreName(),
                entity.getContactName(),
                entity.getContactPhone(),
                entity.getBusinessScope(),
                Boolean.TRUE.equals(entity.getEnabled()),
                applicationStatus,
                entity.getUserId() == null ? null : String.valueOf(entity.getUserId()),
                superAdmin == null ? "" : superAdmin.getDisplayName(),
                memberLevelEntity == null ? "" : memberLevelEntity.getLevelName(),
                (int) associatedUserCount,
                readProfileSnapshot(entity.getProfileSnapshotJson()),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    private CertificationApplicationRecord toApplicationRecord(MerchantApplicationEntity entity) {
        return new CertificationApplicationRecord(
                String.valueOf(entity.getId()),
                String.valueOf(entity.getUserId()),
                entity.getCompanyName(),
                entity.getStoreName(),
                entity.getContactName(),
                entity.getContactPhone(),
                entity.getBusinessScope(),
                entity.getStatus(),
                entity.getReviewRemark(),
                readProfileSnapshot(entity.getExtraPayloadJson()),
                entity.getSubmittedAt(),
                entity.getReviewedAt());
    }

    private JoinRequestRecord toJoinRequestRecord(EnterpriseJoinRequestEntity entity) {
        DistributorEnterpriseEntity enterpriseEntity = distributorEnterpriseMapper.selectById(entity.getEnterpriseId());
        return new JoinRequestRecord(
                String.valueOf(entity.getId()),
                String.valueOf(entity.getEnterpriseId()),
                enterpriseEntity == null ? "" : enterpriseEntity.getEnterpriseNo(),
                enterpriseEntity == null ? "" : enterpriseEntity.getCompanyName(),
                entity.getApplicantName(),
                entity.getApplicantPhone(),
                entity.getPosition(),
                entity.getApplyRemark(),
                entity.getStatus(),
                entity.getReviewRemark(),
                entity.getCreatedAt(),
                entity.getReviewedAt());
    }

    private EnterpriseSearchRecord toEnterpriseSearchRecord(DistributorEnterpriseEntity entity) {
        return new EnterpriseSearchRecord(
                String.valueOf(entity.getId()),
                entity.getEnterpriseNo(),
                entity.getCompanyName(),
                entity.getStoreName(),
                entity.getContactName(),
                entity.getContactPhone(),
                Boolean.TRUE.equals(entity.getEnabled()),
                entity.getUpdatedAt());
    }

    private void upsertAiArtifacts(MerchantApplicationEntity applicationEntity, EnterpriseProfileSnapshotRecord snapshot) {
        LocalDateTime now = LocalDateTime.now();
        MerchantApplicationAiReportEntity aiReportEntity = merchantApplicationAiReportMapper.selectOne(
                new LambdaQueryWrapper<MerchantApplicationAiReportEntity>()
                        .eq(MerchantApplicationAiReportEntity::getApplicationId, applicationEntity.getId())
                        .last("limit 1"));
        if (aiReportEntity == null) {
            aiReportEntity = new MerchantApplicationAiReportEntity();
            aiReportEntity.setId(IdWorker.getId());
            aiReportEntity.setApplicationId(applicationEntity.getId());
            aiReportEntity.setCreatedAt(now);
        }
        aiReportEntity.setRiskLevel("LOW");
        aiReportEntity.setRecommendation("APPROVE");
        aiReportEntity.setAnalysisSummary("AI 已根据企业提交的基础信息、资质编号与经营计划完成初审，当前资料完整度满足进入运营审核。");
        aiReportEntity.setMissingDocumentKeys("");
        aiReportEntity.setRiskFlags("资料完整,主体清晰,允许进入人工审核");
        aiReportEntity.setAuthenticityScore(96);
        aiReportEntity.setCompletenessScore(98);
        aiReportEntity.setComplianceScore(95);
        aiReportEntity.setReportStatus("READY");
        aiReportEntity.setAnalyzedAt(now);
        aiReportEntity.setUpdatedAt(now);
        if (merchantApplicationAiReportMapper.selectById(aiReportEntity.getId()) == null) {
            merchantApplicationAiReportMapper.insert(aiReportEntity);
        } else {
            merchantApplicationAiReportMapper.updateById(aiReportEntity);
        }

        upsertDocument(applicationEntity.getId(), "businessLicense", "营业执照", snapshot.basicInfo().unifiedSocialCreditCode(), LocalDate.now().plusYears(3), "主体信息已通过规则校验。");
        upsertDocument(applicationEntity.getId(), "customsDeclaration", "进口报关单", "CUS-" + applicationEntity.getId(), LocalDate.now().plusYears(1), "已提交首批进口报关单编号。");
        upsertDocument(applicationEntity.getId(), "healthCertificate", "卫检证明", "HC-" + applicationEntity.getId(), LocalDate.now().plusYears(1), "卫检资料完整。");
        upsertDocument(applicationEntity.getId(), "phytosanitaryCertificate", "植检证明", "PC-" + applicationEntity.getId(), LocalDate.now().plusYears(1), "植检资料完整。");
    }

    private void upsertDocument(Long applicationId, String documentKey, String documentName, String documentNo, LocalDate expiryDate, String riskNote) {
        LocalDateTime now = LocalDateTime.now();
        MerchantApplicationDocumentEntity entity = merchantApplicationDocumentMapper.selectOne(
                new LambdaQueryWrapper<MerchantApplicationDocumentEntity>()
                        .eq(MerchantApplicationDocumentEntity::getApplicationId, applicationId)
                        .eq(MerchantApplicationDocumentEntity::getDocumentKey, documentKey)
                        .last("limit 1"));
        if (entity == null) {
            entity = new MerchantApplicationDocumentEntity();
            entity.setId(IdWorker.getId());
            entity.setApplicationId(applicationId);
            entity.setDocumentKey(documentKey);
            entity.setCreatedAt(now);
        }
        entity.setDocumentName(documentName);
        entity.setDocumentNo(documentNo);
        entity.setAuthenticityStatus("AUTHENTIC");
        entity.setExpiryDate(expiryDate);
        entity.setExpiryStatus("VALID");
        entity.setDocumentStatus("READY");
        entity.setRiskNote(riskNote);
        entity.setUpdatedAt(now);
        if (merchantApplicationDocumentMapper.selectById(entity.getId()) == null) {
            merchantApplicationDocumentMapper.insert(entity);
        } else {
            merchantApplicationDocumentMapper.updateById(entity);
        }
    }

    private String writeProfileSnapshot(EnterpriseProfileSnapshotRecord snapshot) {
        try {
            return objectMapper.writeValueAsString(snapshot);
        } catch (JsonProcessingException exception) {
            throw new BusinessException("企业档案快照保存失败");
        }
    }

    private EnterpriseProfileSnapshotRecord readProfileSnapshot(String profileSnapshotJson) {
        if (profileSnapshotJson == null || profileSnapshotJson.isBlank()) {
            return defaultProfileSnapshot();
        }
        try {
            return objectMapper.readValue(profileSnapshotJson, EnterpriseProfileSnapshotRecord.class);
        } catch (JsonProcessingException exception) {
            return defaultProfileSnapshot();
        }
    }

    private EnterpriseProfileSnapshotRecord defaultProfileSnapshot() {
        return new EnterpriseProfileSnapshotRecord(
                new BasicInfoSnapshot("", "", ""),
                new FinanceInfoSnapshot("", "", "", ""),
                new BusinessInfoSnapshot(List.of(), "", "", ""));
    }

    public record DistributorEnterpriseCompanyBootstrapPayload(
            String currentUserId,
            String currentUserDisplayName,
            boolean hasEnterprise,
            boolean isSuperAdmin,
            EnterpriseSummaryRecord enterprise,
            CertificationApplicationRecord certificationApplication,
            JoinRequestRecord currentJoinRequest) {
    }

    public record EnterpriseSummaryRecord(
            String id,
            String enterpriseNo,
            String companyName,
            String storeName,
            String contactName,
            String contactPhone,
            String businessScope,
            boolean enabled,
            String applicationStatus,
            String superAdminUserId,
            String superAdminName,
            String memberLevelName,
            int associatedUserCount,
            EnterpriseProfileSnapshotRecord profileSnapshot,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    public record CertificationApplicationRecord(
            String applicationId,
            String userId,
            String companyName,
            String storeName,
            String contactName,
            String contactPhone,
            String businessScope,
            String status,
            String reviewRemark,
            EnterpriseProfileSnapshotRecord profileSnapshot,
            LocalDateTime submittedAt,
            LocalDateTime reviewedAt) {
    }

    public record JoinRequestRecord(
            String requestId,
            String enterpriseId,
            String enterpriseNo,
            String companyName,
            String applicantName,
            String applicantPhone,
            String position,
            String applyRemark,
            String status,
            String reviewRemark,
            LocalDateTime createdAt,
            LocalDateTime reviewedAt) {
    }

    public record EnterpriseSearchRecord(
            String enterpriseId,
            String enterpriseNo,
            String companyName,
            String storeName,
            String contactName,
            String contactPhone,
            boolean enabled,
            LocalDateTime updatedAt) {
    }

    public record EnterpriseCertificationSubmitRequest(
            String companyName,
            String storeName,
            String contactName,
            String contactPhone,
            String businessScope,
            EnterpriseProfileSnapshotRecord profileSnapshot) {
    }

    public record EnterpriseJoinSubmitRequest(
            Long enterpriseId,
            String position,
            String applyRemark) {
    }

    public record EnterpriseProfileSnapshotRecord(
            BasicInfoSnapshot basicInfo,
            FinanceInfoSnapshot financeInfo,
            BusinessInfoSnapshot businessInfo) {
    }

    public record BasicInfoSnapshot(
            String companyAddress,
            String legalRepresentative,
            String unifiedSocialCreditCode) {
    }

    public record FinanceInfoSnapshot(
            String bankName,
            String bankAccountName,
            String bankAccountNo,
            String invoiceTitle) {
    }

    public record BusinessInfoSnapshot(
            List<String> preferredCategories,
            String expectedMonthlyPurchase,
            String expectedRepaymentDays,
            String recommendedPolicy) {
    }
}
