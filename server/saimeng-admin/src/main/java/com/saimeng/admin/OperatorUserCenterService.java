package com.saimeng.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.saimeng.admin.entity.CustomerPortraitSnapshotEntity;
import com.saimeng.admin.entity.DistributorEnterpriseEntity;
import com.saimeng.admin.entity.MemberLevelConfigEntity;
import com.saimeng.admin.entity.MerchantApplicationAiReportEntity;
import com.saimeng.admin.entity.MerchantApplicationDocumentEntity;
import com.saimeng.admin.mapper.CustomerPortraitSnapshotMapper;
import com.saimeng.admin.mapper.DistributorEnterpriseMapper;
import com.saimeng.admin.mapper.MemberLevelConfigMapper;
import com.saimeng.admin.mapper.MerchantApplicationAiReportMapper;
import com.saimeng.admin.mapper.MerchantApplicationDocumentMapper;
import com.saimeng.common.BusinessException;
import com.saimeng.member.entity.MemberRealNameAuthEntity;
import com.saimeng.member.mapper.MemberRealNameAuthMapper;
import com.saimeng.merchant.MerchantApplicationService;
import com.saimeng.merchant.entity.MerchantApplicationEntity;
import com.saimeng.merchant.mapper.MerchantApplicationMapper;
import com.saimeng.system.RoleCodes;
import com.saimeng.system.UserAccountService;
import com.saimeng.system.entity.SysUserEntity;
import com.saimeng.system.entity.SysUserRoleEntity;
import com.saimeng.system.mapper.SysUserMapper;
import com.saimeng.system.mapper.SysUserRoleMapper;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 运营后台用户中心服务。
 */
@Service
public class OperatorUserCenterService {

    private static final String DEFAULT_MEMBER_LEVEL_KEY = "bronze";
    private static final String PORTRAIT_EXTERNAL_ENDPOINT = "/api/external/erp/customer-metrics";

    private static final List<BenefitOptionRecord> BENEFIT_OPTIONS = List.of(
            new BenefitOptionRecord("credit", "shopping", "信用权益"),
            new BenefitOptionRecord("sample", "shopping", "样品支持"),
            new BenefitOptionRecord("trial", "shopping", "试用资格"),
            new BenefitOptionRecord("flash", "service", "闪购活动"),
            new BenefitOptionRecord("selection", "service", "精选选品"),
            new BenefitOptionRecord("marketing", "service", "营销扶持"),
            new BenefitOptionRecord("support", "service", "专属客服"),
            new BenefitOptionRecord("storage", "travel", "仓配协同"),
            new BenefitOptionRecord("salon", "travel", "沙龙活动"),
            new BenefitOptionRecord("travel", "travel", "差旅礼遇"),
            new BenefitOptionRecord("banquet", "travel", "宴请礼遇"));

    private static final List<HighlightOptionRecord> HIGHLIGHT_OPTIONS = List.of(
            new HighlightOptionRecord("credit", "信用权益亮点"),
            new HighlightOptionRecord("sample", "样品支持亮点"),
            new HighlightOptionRecord("trial", "试用资格亮点"),
            new HighlightOptionRecord("salon", "沙龙活动亮点"),
            new HighlightOptionRecord("support", "专属客服亮点"),
            new HighlightOptionRecord("strategy", "经营策略亮点"));

    private final SysUserMapper sysUserMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final MemberRealNameAuthMapper memberRealNameAuthMapper;
    private final MerchantApplicationMapper merchantApplicationMapper;
    private final DistributorEnterpriseMapper distributorEnterpriseMapper;
    private final MemberLevelConfigMapper memberLevelConfigMapper;
    private final MerchantApplicationAiReportMapper merchantApplicationAiReportMapper;
    private final MerchantApplicationDocumentMapper merchantApplicationDocumentMapper;
    private final CustomerPortraitSnapshotMapper customerPortraitSnapshotMapper;
    private final MerchantApplicationService merchantApplicationService;
    private final UserAccountService userAccountService;

    public OperatorUserCenterService(
            SysUserMapper sysUserMapper,
            SysUserRoleMapper sysUserRoleMapper,
            MemberRealNameAuthMapper memberRealNameAuthMapper,
            MerchantApplicationMapper merchantApplicationMapper,
            DistributorEnterpriseMapper distributorEnterpriseMapper,
            MemberLevelConfigMapper memberLevelConfigMapper,
            MerchantApplicationAiReportMapper merchantApplicationAiReportMapper,
            MerchantApplicationDocumentMapper merchantApplicationDocumentMapper,
            CustomerPortraitSnapshotMapper customerPortraitSnapshotMapper,
            MerchantApplicationService merchantApplicationService,
            UserAccountService userAccountService) {
        this.sysUserMapper = sysUserMapper;
        this.sysUserRoleMapper = sysUserRoleMapper;
        this.memberRealNameAuthMapper = memberRealNameAuthMapper;
        this.merchantApplicationMapper = merchantApplicationMapper;
        this.distributorEnterpriseMapper = distributorEnterpriseMapper;
        this.memberLevelConfigMapper = memberLevelConfigMapper;
        this.merchantApplicationAiReportMapper = merchantApplicationAiReportMapper;
        this.merchantApplicationDocumentMapper = merchantApplicationDocumentMapper;
        this.customerPortraitSnapshotMapper = customerPortraitSnapshotMapper;
        this.merchantApplicationService = merchantApplicationService;
        this.userAccountService = userAccountService;
    }

    /**
     * 获取用户中心初始化数据。
     *
     * @return 初始化数据
     */
    public UserCenterBootstrapPayload getBootstrap() {
        List<SysUserEntity> users = listUsers();
        Map<Long, List<String>> userRolesMap = listUserRoleMap();
        Map<Long, MemberRealNameAuthEntity> authMap = listRealNameAuthMap();
        Map<Long, MerchantApplicationEntity> applicationMap = listMerchantApplicationMap();
        Map<Long, DistributorEnterpriseEntity> enterpriseOwnerMap = listEnterpriseOwnerMap();
        Map<Long, DistributorEnterpriseEntity> enterpriseIdMap = listEnterpriseIdMap();
        Map<Long, MerchantApplicationAiReportEntity> aiReportMap = listApplicationAiReportMap();
        Map<Long, List<MerchantApplicationDocumentEntity>> applicationDocumentMap = listApplicationDocumentMap();
        Map<Long, CustomerPortraitSnapshotEntity> userPortraitMap = listCustomerPortraitMap();
        Map<Long, List<CustomerPortraitSnapshotEntity>> enterprisePortraitMap = listEnterprisePortraitMap();
        Map<String, MemberLevelConfigEntity> memberLevelMap = listMemberLevelEntityMap();

        List<CustomerRecord> customerRecords = users.stream()
                .sorted(Comparator.comparing(SysUserEntity::getCreatedAt).reversed())
                .map(user -> toCustomerRecord(
                        user,
                        userRolesMap.getOrDefault(user.getId(), List.of()),
                        authMap.get(user.getId()),
                        applicationMap.get(user.getId()),
                        resolveUserEnterprise(user, enterpriseOwnerMap, enterpriseIdMap),
                        userPortraitMap.get(user.getId())))
                .toList();

        List<MerchantReviewRecord> reviewRecords = merchantApplicationMapper.selectList(null).stream()
                .sorted(Comparator.comparing(MerchantApplicationEntity::getSubmittedAt).reversed())
                .map(application -> toMerchantReviewRecord(
                        application,
                        findUser(users, application.getUserId()),
                        authMap.get(application.getUserId()),
                        aiReportMap.get(application.getId()),
                        applicationDocumentMap.getOrDefault(application.getId(), List.of())))
                .toList();

        List<DistributorEnterpriseRecord> enterpriseRecords = distributorEnterpriseMapper.selectList(
                        new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                                .eq(DistributorEnterpriseEntity::getDeleted, false))
                .stream()
                .sorted(Comparator.comparing(DistributorEnterpriseEntity::getUpdatedAt).reversed())
                .map(entity -> toDistributorEnterpriseRecord(
                        entity,
                        entity.getUserId() == null ? null : findUser(users, entity.getUserId()),
                        memberLevelMap.get(entity.getMemberLevelKey()),
                        users,
                        userRolesMap,
                        authMap,
                        applicationMap,
                        aiReportMap.get(entity.getApplicationId()),
                        applicationDocumentMap.getOrDefault(entity.getApplicationId(), List.of()),
                        enterprisePortraitMap.getOrDefault(entity.getId(), List.of()),
                        userPortraitMap.get(entity.getUserId())))
                .toList();

        List<MemberLevelConfigRecord> memberLevelRecords = getMemberCenterConfig().levels();

        return new UserCenterBootstrapPayload(
                customerRecords,
                reviewRecords,
                enterpriseRecords,
                memberLevelRecords,
                BENEFIT_OPTIONS,
                HIGHLIGHT_OPTIONS,
                getPortraitExternalDataTemplate());
    }

    /**
     * 获取商城会员中心公开配置。
     *
     * @return 等级配置
     */
    public PublicMemberCenterConfigPayload getMemberCenterConfig() {
        List<MemberLevelConfigRecord> levelRecords = memberLevelConfigMapper.selectList(
                        new LambdaQueryWrapper<MemberLevelConfigEntity>()
                                .eq(MemberLevelConfigEntity::getDeleted, false)
                                .eq(MemberLevelConfigEntity::getEnabled, true))
                .stream()
                .sorted(Comparator.comparing(MemberLevelConfigEntity::getLevelRank))
                .map(this::toMemberLevelConfigRecord)
                .toList();
        return new PublicMemberCenterConfigPayload(levelRecords);
    }

    /**
     * 获取客户画像外部数据预留接口模板。
     *
     * @return 外部接口模板
     */
    public PortraitExternalDataTemplateRecord getPortraitExternalDataTemplate() {
        return new PortraitExternalDataTemplateRecord(
                "ERP/财务外部数据接口",
                "POST",
                PORTRAIT_EXTERNAL_ENDPOINT,
                List.of("userId", "pickupCategories", "pickupFrequencyPerMonth", "avgOrderAmount", "repaymentDays"),
                "当前为预留接口，接入外部 ERP/财务系统后即可回填拿货频次、客单价与回款速度。");
    }

    /**
     * 创建前端注册客户。
     *
     * @param request 创建请求
     * @return 用户记录
     */
    @Transactional
    public CustomerRecord createUser(UserUpsertRequest request) {
        validateUserRequest(request, null);
        LocalDateTime now = LocalDateTime.now();
        SysUserEntity entity = new SysUserEntity();
        entity.setId(IdWorker.getId());
        entity.setPhone(request.phone());
        entity.setPassword(request.password());
        entity.setDisplayName(request.displayName());
        entity.setEnterpriseId(parseNullableLong(request.enterpriseId()));
        entity.setEnabled(request.enabled());
        entity.setDeleted(false);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        sysUserMapper.insert(entity);
        syncPortraitEnterpriseBinding(entity.getId(), entity.getEnterpriseId());
        syncDistributorRole(entity.getId(), shouldGrantDistributorAccess(entity.getId(), entity.getEnterpriseId()));
        DistributorEnterpriseEntity enterpriseEntity = entity.getEnterpriseId() == null ? null : getRequiredEnterprise(entity.getEnterpriseId());
        return toCustomerRecord(entity, List.of(), null, null, enterpriseEntity, null);
    }

    /**
     * 更新前端注册客户。
     *
     * @param userId 用户 ID
     * @param request 更新请求
     * @return 用户记录
     */
    @Transactional
    public CustomerRecord updateUser(Long userId, UserUpsertRequest request) {
        SysUserEntity entity = getRequiredUser(userId);
        validateUserRequest(request, userId);
        Long previousEnterpriseId = entity.getEnterpriseId();
        Long nextEnterpriseId = parseNullableLong(request.enterpriseId());
        entity.setPhone(request.phone());
        entity.setDisplayName(request.displayName());
        entity.setEnterpriseId(nextEnterpriseId);
        entity.setEnabled(request.enabled());
        if (request.password() != null && !request.password().isBlank()) {
            entity.setPassword(request.password());
        }
        entity.setUpdatedAt(LocalDateTime.now());
        sysUserMapper.updateById(entity);
        handleOwnerBindingChange(userId, previousEnterpriseId, nextEnterpriseId);
        syncPortraitEnterpriseBinding(userId, nextEnterpriseId);

        MemberRealNameAuthEntity authEntity = memberRealNameAuthMapper.selectOne(new LambdaQueryWrapper<MemberRealNameAuthEntity>()
                .eq(MemberRealNameAuthEntity::getUserId, userId)
                .last("limit 1"));
        MerchantApplicationEntity applicationEntity = merchantApplicationMapper.selectOne(new LambdaQueryWrapper<MerchantApplicationEntity>()
                .eq(MerchantApplicationEntity::getUserId, userId)
                .last("limit 1"));
        DistributorEnterpriseEntity enterpriseEntity = nextEnterpriseId == null
                ? distributorEnterpriseMapper.selectOne(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                        .eq(DistributorEnterpriseEntity::getUserId, userId)
                        .eq(DistributorEnterpriseEntity::getDeleted, false)
                        .last("limit 1"))
                : distributorEnterpriseMapper.selectById(nextEnterpriseId);
        CustomerPortraitSnapshotEntity portraitEntity = customerPortraitSnapshotMapper.selectOne(new LambdaQueryWrapper<CustomerPortraitSnapshotEntity>()
                .eq(CustomerPortraitSnapshotEntity::getUserId, userId)
                .eq(CustomerPortraitSnapshotEntity::getDeleted, false)
                .last("limit 1"));

        if (!request.enabled()) {
            if (enterpriseEntity != null && Boolean.TRUE.equals(enterpriseEntity.getEnabled())) {
                enterpriseEntity.setEnabled(false);
                enterpriseEntity.setUpdatedAt(LocalDateTime.now());
                distributorEnterpriseMapper.updateById(enterpriseEntity);
            }
        }
        syncDistributorRole(userId, request.enabled() && shouldGrantDistributorAccess(userId, nextEnterpriseId));

        return toCustomerRecord(
                entity,
                listUserRoleMap().getOrDefault(userId, List.of()),
                authEntity,
                applicationEntity,
                enterpriseEntity,
                portraitEntity);
    }

    /**
     * 删除前端注册客户。
     *
     * @param userId 用户 ID
     */
    @Transactional
    public void deleteUser(Long userId) {
        SysUserEntity entity = getRequiredUser(userId);
        entity.setEnabled(false);
        entity.setDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
        sysUserMapper.updateById(entity);
        sysUserRoleMapper.delete(new LambdaQueryWrapper<SysUserRoleEntity>()
                .eq(SysUserRoleEntity::getUserId, userId));
        DistributorEnterpriseEntity enterpriseEntity = distributorEnterpriseMapper.selectOne(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                .eq(DistributorEnterpriseEntity::getUserId, userId)
                .eq(DistributorEnterpriseEntity::getDeleted, false)
                .last("limit 1"));
        if (enterpriseEntity != null) {
            enterpriseEntity.setEnabled(false);
            enterpriseEntity.setUpdatedAt(LocalDateTime.now());
            distributorEnterpriseMapper.updateById(enterpriseEntity);
        }
    }

    /**
     * 审核通过分销商认证。
     *
     * @param applicationId 申请 ID
     * @return 审核记录
     */
    @Transactional
    public MerchantReviewRecord approveMerchantApplication(Long applicationId) {
        validateAiReviewBeforeApprove(applicationId);
        MerchantApplicationService.MerchantApplicationRecord record = merchantApplicationService.approve(applicationId);
        SysUserEntity user = getRequiredUser(record.userId());
        upsertEnterpriseFromApplication(record, user);
        MemberRealNameAuthEntity authEntity = memberRealNameAuthMapper.selectOne(new LambdaQueryWrapper<MemberRealNameAuthEntity>()
                .eq(MemberRealNameAuthEntity::getUserId, record.userId())
                .last("limit 1"));
        MerchantApplicationEntity applicationEntity = getRequiredApplication(applicationId);
        return toMerchantReviewRecord(
                applicationEntity,
                user,
                authEntity,
                getRequiredAiReport(applicationId),
                listDocumentsByApplicationId(applicationId));
    }

    /**
     * 驳回分销商认证。
     *
     * @param applicationId 申请 ID
     * @param request 驳回请求
     * @return 审核记录
     */
    @Transactional
    public MerchantReviewRecord rejectMerchantApplication(Long applicationId, ReviewRejectRequest request) {
        MerchantApplicationService.MerchantApplicationRecord record = merchantApplicationService.reject(applicationId, request.reason());
        SysUserEntity user = getRequiredUser(record.userId());
        MemberRealNameAuthEntity authEntity = memberRealNameAuthMapper.selectOne(new LambdaQueryWrapper<MemberRealNameAuthEntity>()
                .eq(MemberRealNameAuthEntity::getUserId, record.userId())
                .last("limit 1"));
        MerchantApplicationEntity applicationEntity = getRequiredApplication(applicationId);
        return toMerchantReviewRecord(
                applicationEntity,
                user,
                authEntity,
                merchantApplicationAiReportMapper.selectOne(new LambdaQueryWrapper<MerchantApplicationAiReportEntity>()
                        .eq(MerchantApplicationAiReportEntity::getApplicationId, applicationId)
                        .last("limit 1")),
                listDocumentsByApplicationId(applicationId));
    }

    /**
     * 创建企业。
     *
     * @param request 创建请求
     * @return 企业记录
     */
    @Transactional
    public DistributorEnterpriseRecord createEnterprise(EnterpriseUpsertRequest request) {
        validateEnterpriseRequest(request, null);
        DistributorEnterpriseEntity entity = new DistributorEnterpriseEntity();
        entity.setId(IdWorker.getId());
        entity.setEnterpriseNo(nextEnterpriseNo());
        entity.setSourceType(request.sourceType());
        applyEnterpriseValues(entity, request);
        entity.setDeleted(false);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        distributorEnterpriseMapper.insert(entity);
        syncEnterpriseOwnerBinding(null, entity);
        List<SysUserEntity> users = listUsers();
        return toDistributorEnterpriseRecord(
                entity,
                entity.getUserId() == null ? null : getRequiredUser(entity.getUserId()),
                findMemberLevelEntity(entity.getMemberLevelKey()),
                users,
                listUserRoleMap(),
                listRealNameAuthMap(),
                listMerchantApplicationMap(),
                entity.getApplicationId() == null ? null : getRequiredAiReport(entity.getApplicationId()),
                entity.getApplicationId() == null ? List.of() : listDocumentsByApplicationId(entity.getApplicationId()),
                listEnterprisePortraitMap().getOrDefault(entity.getId(), List.of()),
                entity.getUserId() == null ? null : listCustomerPortraitMap().get(entity.getUserId()));
    }

    /**
     * 更新企业。
     *
     * @param enterpriseId 企业 ID
     * @param request 更新请求
     * @return 企业记录
     */
    @Transactional
    public DistributorEnterpriseRecord updateEnterprise(Long enterpriseId, EnterpriseUpsertRequest request) {
        DistributorEnterpriseEntity entity = getRequiredEnterprise(enterpriseId);
        Long previousOwnerUserId = entity.getUserId();
        validateEnterpriseRequest(request, enterpriseId);
        applyEnterpriseValues(entity, request);
        entity.setUpdatedAt(LocalDateTime.now());
        distributorEnterpriseMapper.updateById(entity);
        syncEnterpriseOwnerBinding(previousOwnerUserId, entity);
        List<SysUserEntity> users = listUsers();
        return toDistributorEnterpriseRecord(
                entity,
                entity.getUserId() == null ? null : getRequiredUser(entity.getUserId()),
                findMemberLevelEntity(entity.getMemberLevelKey()),
                users,
                listUserRoleMap(),
                listRealNameAuthMap(),
                listMerchantApplicationMap(),
                entity.getApplicationId() == null ? null : getRequiredAiReport(entity.getApplicationId()),
                entity.getApplicationId() == null ? List.of() : listDocumentsByApplicationId(entity.getApplicationId()),
                listEnterprisePortraitMap().getOrDefault(entity.getId(), List.of()),
                entity.getUserId() == null ? null : listCustomerPortraitMap().get(entity.getUserId()));
    }

    /**
     * 创建会员等级。
     *
     * @param request 创建请求
     * @return 等级配置
     */
    @Transactional
    public MemberLevelConfigRecord createMemberLevel(MemberLevelUpsertRequest request) {
        validateMemberLevelRequest(request, null);
        MemberLevelConfigEntity entity = new MemberLevelConfigEntity();
        entity.setId(IdWorker.getId());
        applyMemberLevelValues(entity, request);
        entity.setDeleted(false);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        memberLevelConfigMapper.insert(entity);
        return toMemberLevelConfigRecord(entity);
    }

    /**
     * 更新会员等级。
     *
     * @param levelId 等级 ID
     * @param request 更新请求
     * @return 等级配置
     */
    @Transactional
    public MemberLevelConfigRecord updateMemberLevel(Long levelId, MemberLevelUpsertRequest request) {
        MemberLevelConfigEntity entity = getRequiredMemberLevel(levelId);
        validateMemberLevelRequest(request, levelId);
        applyMemberLevelValues(entity, request);
        entity.setUpdatedAt(LocalDateTime.now());
        memberLevelConfigMapper.updateById(entity);
        return toMemberLevelConfigRecord(entity);
    }

    /**
     * 删除会员等级。
     *
     * @param levelId 等级 ID
     */
    @Transactional
    public void deleteMemberLevel(Long levelId) {
        MemberLevelConfigEntity entity = getRequiredMemberLevel(levelId);
        entity.setDeleted(true);
        entity.setEnabled(false);
        entity.setUpdatedAt(LocalDateTime.now());
        memberLevelConfigMapper.updateById(entity);
    }

    private void applyEnterpriseValues(DistributorEnterpriseEntity entity, EnterpriseUpsertRequest request) {
        entity.setUserId(parseNullableLong(request.userId()));
        entity.setApplicationId(parseNullableLong(request.applicationId()));
        entity.setCompanyName(request.companyName());
        entity.setStoreName(request.storeName());
        entity.setContactName(request.contactName());
        entity.setContactPhone(request.contactPhone());
        entity.setBusinessScope(request.businessScope());
        entity.setEnabled(request.enabled());
        entity.setReviewRemark(request.reviewRemark());
        entity.setMemberLevelKey(parseNullableString(request.memberLevelKey()));
        if (entity.getEnterpriseNo() == null || entity.getEnterpriseNo().isBlank()) {
            entity.setEnterpriseNo(nextEnterpriseNo());
        }
    }

    private void applyMemberLevelValues(MemberLevelConfigEntity entity, MemberLevelUpsertRequest request) {
        entity.setLevelKey(request.levelKey());
        entity.setLevelName(request.levelName());
        entity.setLevelRank(request.levelRank());
        entity.setLevelTitle(request.levelTitle());
        entity.setLevelDescription(request.levelDescription());
        entity.setSummaryText(request.summaryText());
        entity.setProgressText(request.progressText());
        entity.setMissionText(request.missionText());
        entity.setMissionAction(request.missionAction());
        entity.setHighlightTitle(request.highlightTitle());
        entity.setVisualSrc(request.visualSrc());
        entity.setHeroStart(request.heroStart());
        entity.setHeroMid(request.heroMid());
        entity.setHeroEnd(request.heroEnd());
        entity.setAccent(request.accent());
        entity.setSoftAccent(request.softAccent());
        entity.setCardSurface(request.cardSurface());
        entity.setPlaceholderTone(request.placeholderTone());
        entity.setGlowColor(request.glowColor());
        entity.setSparkColor(request.sparkColor());
        entity.setProgressPercent(request.progressPercent());
        entity.setHighlightKeys(joinCsv(request.highlightKeys()));
        entity.setBenefitKeys(joinCsv(request.benefitKeys()));
        entity.setEnabled(request.enabled());
    }

    private void validateEnterpriseRequest(EnterpriseUpsertRequest request, Long enterpriseId) {
        Long userId = parseNullableLong(request.userId());
        if (userId != null) {
            getRequiredUser(userId);
            long duplicatedCount = distributorEnterpriseMapper.selectCount(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                    .eq(DistributorEnterpriseEntity::getUserId, userId)
                    .eq(DistributorEnterpriseEntity::getDeleted, false)
                    .ne(enterpriseId != null, DistributorEnterpriseEntity::getId, enterpriseId));
            if (duplicatedCount > 0) {
                throw new BusinessException("该客户已绑定企业档案");
            }
        }

        Long applicationId = parseNullableLong(request.applicationId());
        if (applicationId != null) {
            MerchantApplicationEntity applicationEntity = getRequiredApplication(applicationId);
            if (!"APPROVED".equals(applicationEntity.getStatus())) {
                throw new BusinessException("仅审核通过的经销商企业认证申请可转为企业档案");
            }
        }

        if (request.memberLevelKey() != null && !request.memberLevelKey().isBlank()) {
            findEnabledMemberLevelEntity(request.memberLevelKey());
        }
    }

    private void validateMemberLevelRequest(MemberLevelUpsertRequest request, Long levelId) {
        long duplicateKeyCount = memberLevelConfigMapper.selectCount(new LambdaQueryWrapper<MemberLevelConfigEntity>()
                .eq(MemberLevelConfigEntity::getLevelKey, request.levelKey())
                .eq(MemberLevelConfigEntity::getDeleted, false)
                .ne(levelId != null, MemberLevelConfigEntity::getId, levelId));
        if (duplicateKeyCount > 0) {
            throw new BusinessException("会员等级标识已存在");
        }
        if (request.progressPercent() < 0 || request.progressPercent() > 100) {
            throw new BusinessException("成长进度必须在 0 到 100 之间");
        }
    }

    private void validateUserRequest(UserUpsertRequest request, Long userId) {
        ensureUserPhoneUnique(request.phone(), userId);
        Long enterpriseId = parseNullableLong(request.enterpriseId());
        if (enterpriseId != null) {
            getRequiredEnterprise(enterpriseId);
        }
    }

    private void validateAiReviewBeforeApprove(Long applicationId) {
        MerchantApplicationAiReportEntity aiReport = getRequiredAiReport(applicationId);
        List<MerchantApplicationDocumentEntity> documents = listDocumentsByApplicationId(applicationId);
        if (documents.isEmpty()) {
            throw new BusinessException("AI 分析报告未包含证件明细，暂不可通过审核");
        }
        if ("REJECT".equals(aiReport.getRecommendation())) {
            throw new BusinessException("AI 分析报告识别到资质不全或高风险证件，禁止通过审核");
        }
        boolean hasBlockingDocument = documents.stream().anyMatch(document ->
                "MISSING".equals(document.getDocumentStatus())
                        || "SUSPECT".equals(document.getAuthenticityStatus())
                        || "EXPIRED".equals(document.getExpiryStatus()));
        if (hasBlockingDocument) {
            throw new BusinessException("AI 分析报告识别到证件缺失、疑似造假或已过期，禁止通过审核");
        }
    }

    private void ensureUserPhoneUnique(String phone, Long userId) {
        long count = sysUserMapper.selectCount(new LambdaQueryWrapper<SysUserEntity>()
                .eq(SysUserEntity::getPhone, phone)
                .eq(SysUserEntity::getDeleted, false)
                .ne(userId != null, SysUserEntity::getId, userId));
        if (count > 0) {
            throw new BusinessException("手机号已存在");
        }
    }

    private void handleOwnerBindingChange(Long userId, Long previousEnterpriseId, Long nextEnterpriseId) {
        if (Objects.equals(previousEnterpriseId, nextEnterpriseId)) {
            return;
        }
        if (previousEnterpriseId != null) {
            DistributorEnterpriseEntity previousEnterprise = distributorEnterpriseMapper.selectById(previousEnterpriseId);
            if (previousEnterprise != null && Objects.equals(previousEnterprise.getUserId(), userId)) {
                previousEnterprise.setUserId(null);
                previousEnterprise.setUpdatedAt(LocalDateTime.now());
                distributorEnterpriseMapper.updateById(previousEnterprise);
            }
        }
    }

    private void syncEnterpriseOwnerBinding(Long previousOwnerUserId, DistributorEnterpriseEntity enterpriseEntity) {
        if (previousOwnerUserId != null && !Objects.equals(previousOwnerUserId, enterpriseEntity.getUserId())) {
            SysUserEntity previousOwner = sysUserMapper.selectById(previousOwnerUserId);
            if (previousOwner != null && !Boolean.TRUE.equals(previousOwner.getDeleted()) && Objects.equals(previousOwner.getEnterpriseId(), enterpriseEntity.getId())) {
                previousOwner.setEnterpriseId(null);
                previousOwner.setUpdatedAt(LocalDateTime.now());
                sysUserMapper.updateById(previousOwner);
                syncPortraitEnterpriseBinding(previousOwnerUserId, null);
                syncDistributorRole(previousOwnerUserId, shouldGrantDistributorAccess(previousOwnerUserId, null));
            }
        }

        if (enterpriseEntity.getUserId() == null) {
            return;
        }

        SysUserEntity owner = getRequiredUser(enterpriseEntity.getUserId());
        if (!Objects.equals(owner.getEnterpriseId(), enterpriseEntity.getId())) {
            owner.setEnterpriseId(enterpriseEntity.getId());
            owner.setUpdatedAt(LocalDateTime.now());
            sysUserMapper.updateById(owner);
        }
        syncPortraitEnterpriseBinding(owner.getId(), enterpriseEntity.getId());
        syncDistributorRole(owner.getId(), Boolean.TRUE.equals(owner.getEnabled()) && shouldGrantDistributorAccess(owner.getId(), enterpriseEntity.getId()));
    }

    private void syncPortraitEnterpriseBinding(Long userId, Long enterpriseId) {
        CustomerPortraitSnapshotEntity portraitEntity = customerPortraitSnapshotMapper.selectOne(new LambdaQueryWrapper<CustomerPortraitSnapshotEntity>()
                .eq(CustomerPortraitSnapshotEntity::getUserId, userId)
                .eq(CustomerPortraitSnapshotEntity::getDeleted, false)
                .last("limit 1"));
        if (portraitEntity == null) {
            return;
        }
        portraitEntity.setEnterpriseId(enterpriseId);
        portraitEntity.setUpdatedAt(LocalDateTime.now());
        customerPortraitSnapshotMapper.updateById(portraitEntity);
    }

    private boolean shouldGrantDistributorAccess(Long userId, Long enterpriseId) {
        if (enterpriseId != null) {
            DistributorEnterpriseEntity enterpriseEntity = distributorEnterpriseMapper.selectById(enterpriseId);
            if (enterpriseEntity != null && !Boolean.TRUE.equals(enterpriseEntity.getDeleted()) && Boolean.TRUE.equals(enterpriseEntity.getEnabled())) {
                return true;
            }
        }
        DistributorEnterpriseEntity ownedEnterprise = distributorEnterpriseMapper.selectOne(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                .eq(DistributorEnterpriseEntity::getUserId, userId)
                .eq(DistributorEnterpriseEntity::getDeleted, false)
                .eq(DistributorEnterpriseEntity::getEnabled, true)
                .last("limit 1"));
        return ownedEnterprise != null;
    }

    private void upsertEnterpriseFromApplication(MerchantApplicationService.MerchantApplicationRecord record, SysUserEntity user) {
        MerchantApplicationEntity applicationEntity = getRequiredApplication(record.applicationId());
        DistributorEnterpriseEntity entity = distributorEnterpriseMapper.selectOne(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                .eq(DistributorEnterpriseEntity::getApplicationId, record.applicationId())
                .eq(DistributorEnterpriseEntity::getDeleted, false)
                .last("limit 1"));
        if (entity == null) {
            entity = distributorEnterpriseMapper.selectOne(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                    .eq(DistributorEnterpriseEntity::getUserId, record.userId())
                    .eq(DistributorEnterpriseEntity::getDeleted, false)
                    .last("limit 1"));
        }
        if (entity == null) {
            entity = new DistributorEnterpriseEntity();
            entity.setId(IdWorker.getId());
            entity.setCreatedAt(LocalDateTime.now());
            entity.setDeleted(false);
            entity.setSourceType("APPLICATION");
        }
        Long previousOwnerUserId = entity.getUserId();
        entity.setUserId(record.userId());
        entity.setApplicationId(record.applicationId());
        entity.setCompanyName(record.companyName());
        entity.setStoreName(record.storeName());
        entity.setContactName(record.contactName());
        entity.setContactPhone(applicationEntity == null || applicationEntity.getContactPhone() == null || applicationEntity.getContactPhone().isBlank()
                ? user.getPhone()
                : applicationEntity.getContactPhone());
        entity.setBusinessScope(record.businessScope());
        entity.setEnabled(true);
        entity.setReviewRemark(record.reviewRemark());
        entity.setProfileSnapshotJson(applicationEntity == null ? null : applicationEntity.getExtraPayloadJson());
        if (entity.getMemberLevelKey() == null || entity.getMemberLevelKey().isBlank()) {
            entity.setMemberLevelKey(DEFAULT_MEMBER_LEVEL_KEY);
        }
        if (entity.getEnterpriseNo() == null || entity.getEnterpriseNo().isBlank()) {
            entity.setEnterpriseNo(nextEnterpriseNo());
        }
        entity.setUpdatedAt(LocalDateTime.now());
        if (distributorEnterpriseMapper.selectById(entity.getId()) == null) {
            distributorEnterpriseMapper.insert(entity);
        } else {
            distributorEnterpriseMapper.updateById(entity);
        }
        syncEnterpriseOwnerBinding(previousOwnerUserId, entity);
    }

    private void syncDistributorRole(Long userId, boolean enabled) {
        boolean hasRole = userAccountService.hasRole(userId, RoleCodes.DISTRIBUTOR);
        if (enabled && !hasRole) {
            userAccountService.addRole(userId, RoleCodes.DISTRIBUTOR);
        }
        if (!enabled && hasRole) {
            userAccountService.removeRole(userId, RoleCodes.DISTRIBUTOR);
        }
    }

    private SysUserEntity getRequiredUser(Long userId) {
        SysUserEntity entity = sysUserMapper.selectById(userId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("客户不存在");
        }
        return entity;
    }

    private MerchantApplicationEntity getRequiredApplication(Long applicationId) {
        MerchantApplicationEntity entity = merchantApplicationMapper.selectById(applicationId);
        if (entity == null) {
            throw new BusinessException("经销商企业认证申请不存在");
        }
        return entity;
    }

    private MerchantApplicationAiReportEntity getRequiredAiReport(Long applicationId) {
        MerchantApplicationAiReportEntity entity = merchantApplicationAiReportMapper.selectOne(
                new LambdaQueryWrapper<MerchantApplicationAiReportEntity>()
                        .eq(MerchantApplicationAiReportEntity::getApplicationId, applicationId)
                        .last("limit 1"));
        if (entity == null) {
            throw new BusinessException("AI 分析报告不存在");
        }
        return entity;
    }

    private DistributorEnterpriseEntity getRequiredEnterprise(Long enterpriseId) {
        DistributorEnterpriseEntity entity = distributorEnterpriseMapper.selectById(enterpriseId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("企业档案不存在");
        }
        return entity;
    }

    private MemberLevelConfigEntity getRequiredMemberLevel(Long levelId) {
        MemberLevelConfigEntity entity = memberLevelConfigMapper.selectById(levelId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("会员等级不存在");
        }
        return entity;
    }

    private MemberLevelConfigEntity findMemberLevelEntity(String levelKey) {
        if (levelKey == null || levelKey.isBlank()) {
            return null;
        }
        return memberLevelConfigMapper.selectOne(new LambdaQueryWrapper<MemberLevelConfigEntity>()
                .eq(MemberLevelConfigEntity::getLevelKey, levelKey)
                .eq(MemberLevelConfigEntity::getDeleted, false)
                .last("limit 1"));
    }

    private MemberLevelConfigEntity findEnabledMemberLevelEntity(String levelKey) {
        MemberLevelConfigEntity entity = memberLevelConfigMapper.selectOne(new LambdaQueryWrapper<MemberLevelConfigEntity>()
                .eq(MemberLevelConfigEntity::getLevelKey, levelKey)
                .eq(MemberLevelConfigEntity::getDeleted, false)
                .eq(MemberLevelConfigEntity::getEnabled, true)
                .last("limit 1"));
        if (entity == null) {
            throw new BusinessException("会员等级不存在或已停用");
        }
        return entity;
    }

    private List<SysUserEntity> listUsers() {
        return sysUserMapper.selectList(new LambdaQueryWrapper<SysUserEntity>()
                .eq(SysUserEntity::getDeleted, false));
    }

    private Map<Long, List<String>> listUserRoleMap() {
        return sysUserRoleMapper.selectList(null).stream()
                .collect(Collectors.groupingBy(
                        SysUserRoleEntity::getUserId,
                        LinkedHashMap::new,
                        Collectors.mapping(SysUserRoleEntity::getRoleCode, Collectors.toList())));
    }

    private Map<Long, MemberRealNameAuthEntity> listRealNameAuthMap() {
        return memberRealNameAuthMapper.selectList(null).stream()
                .collect(Collectors.toMap(MemberRealNameAuthEntity::getUserId, entity -> entity, (left, right) -> right));
    }

    private Map<Long, MerchantApplicationEntity> listMerchantApplicationMap() {
        return merchantApplicationMapper.selectList(null).stream()
                .collect(Collectors.toMap(MerchantApplicationEntity::getUserId, entity -> entity, (left, right) -> right));
    }

    private Map<Long, DistributorEnterpriseEntity> listEnterpriseOwnerMap() {
        return distributorEnterpriseMapper.selectList(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                        .eq(DistributorEnterpriseEntity::getDeleted, false))
                .stream()
                .filter(entity -> entity.getUserId() != null)
                .collect(Collectors.toMap(DistributorEnterpriseEntity::getUserId, entity -> entity, (left, right) -> right));
    }

    private Map<Long, DistributorEnterpriseEntity> listEnterpriseIdMap() {
        return distributorEnterpriseMapper.selectList(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                        .eq(DistributorEnterpriseEntity::getDeleted, false))
                .stream()
                .collect(Collectors.toMap(DistributorEnterpriseEntity::getId, entity -> entity, (left, right) -> right));
    }

    private Map<Long, MerchantApplicationAiReportEntity> listApplicationAiReportMap() {
        return merchantApplicationAiReportMapper.selectList(null).stream()
                .collect(Collectors.toMap(MerchantApplicationAiReportEntity::getApplicationId, entity -> entity, (left, right) -> right));
    }

    private Map<Long, List<MerchantApplicationDocumentEntity>> listApplicationDocumentMap() {
        return merchantApplicationDocumentMapper.selectList(null).stream()
                .collect(Collectors.groupingBy(
                        MerchantApplicationDocumentEntity::getApplicationId,
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    private List<MerchantApplicationDocumentEntity> listDocumentsByApplicationId(Long applicationId) {
        return merchantApplicationDocumentMapper.selectList(new LambdaQueryWrapper<MerchantApplicationDocumentEntity>()
                .eq(MerchantApplicationDocumentEntity::getApplicationId, applicationId));
    }

    private Map<Long, CustomerPortraitSnapshotEntity> listCustomerPortraitMap() {
        return customerPortraitSnapshotMapper.selectList(new LambdaQueryWrapper<CustomerPortraitSnapshotEntity>()
                        .eq(CustomerPortraitSnapshotEntity::getDeleted, false))
                .stream()
                .collect(Collectors.toMap(CustomerPortraitSnapshotEntity::getUserId, entity -> entity, (left, right) -> right));
    }

    private Map<Long, List<CustomerPortraitSnapshotEntity>> listEnterprisePortraitMap() {
        return customerPortraitSnapshotMapper.selectList(new LambdaQueryWrapper<CustomerPortraitSnapshotEntity>()
                        .eq(CustomerPortraitSnapshotEntity::getDeleted, false)
                        .isNotNull(CustomerPortraitSnapshotEntity::getEnterpriseId))
                .stream()
                .collect(Collectors.groupingBy(
                        CustomerPortraitSnapshotEntity::getEnterpriseId,
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    private Map<String, MemberLevelConfigEntity> listMemberLevelEntityMap() {
        return memberLevelConfigMapper.selectList(new LambdaQueryWrapper<MemberLevelConfigEntity>()
                        .eq(MemberLevelConfigEntity::getDeleted, false))
                .stream()
                .collect(Collectors.toMap(MemberLevelConfigEntity::getLevelKey, entity -> entity, (left, right) -> right));
    }

    private SysUserEntity findUser(List<SysUserEntity> users, Long userId) {
        return users.stream()
                .filter(user -> Objects.equals(user.getId(), userId))
                .findFirst()
                .orElse(null);
    }

    private DistributorEnterpriseEntity resolveUserEnterprise(
            SysUserEntity user,
            Map<Long, DistributorEnterpriseEntity> enterpriseOwnerMap,
            Map<Long, DistributorEnterpriseEntity> enterpriseIdMap) {
        if (user.getEnterpriseId() != null) {
            DistributorEnterpriseEntity enterpriseEntity = enterpriseIdMap.get(user.getEnterpriseId());
            if (enterpriseEntity != null) {
                return enterpriseEntity;
            }
        }
        return enterpriseOwnerMap.get(user.getId());
    }

    private CustomerRecord toCustomerRecord(
            SysUserEntity user,
            List<String> roleCodes,
            MemberRealNameAuthEntity authEntity,
            MerchantApplicationEntity applicationEntity,
            DistributorEnterpriseEntity enterpriseEntity,
            CustomerPortraitSnapshotEntity portraitEntity) {
        return new CustomerRecord(
                String.valueOf(user.getId()),
                user.getPhone(),
                user.getDisplayName(),
                Boolean.TRUE.equals(user.getEnabled()),
                enterpriseEntity == null ? null : String.valueOf(enterpriseEntity.getId()),
                enterpriseEntity == null ? "" : enterpriseEntity.getCompanyName(),
                roleCodes,
                authEntity == null ? "UNSUBMITTED" : authEntity.getStatus(),
                authEntity == null ? "" : authEntity.getRealName(),
                applicationEntity == null ? "NONE" : applicationEntity.getStatus(),
                enterpriseEntity == null ? "NONE" : (Boolean.TRUE.equals(enterpriseEntity.getEnabled()) ? "ENABLED" : "DISABLED"),
                portraitEntity == null ? "" : portraitEntity.getSegmentCode(),
                portraitEntity == null ? "" : portraitEntity.getSegmentName(),
                portraitEntity == null ? List.of() : parseCsv(portraitEntity.getPrimaryCategories()),
                portraitEntity == null ? null : portraitEntity.getPickupFrequencyPerMonth(),
                portraitEntity == null ? null : portraitEntity.getAvgOrderAmount(),
                portraitEntity == null ? null : portraitEntity.getRepaymentDays(),
                portraitEntity == null ? "" : portraitEntity.getRecommendedPolicy(),
                portraitEntity == null ? List.of() : parseCsv(portraitEntity.getPolicyTags()),
                portraitEntity == null ? "PENDING" : portraitEntity.getExternalDataStatus(),
                portraitEntity == null ? PORTRAIT_EXTERNAL_ENDPOINT : portraitEntity.getExternalDataEndpoint(),
                portraitEntity == null ? null : portraitEntity.getLastSyncedAt(),
                user.getCreatedAt());
    }

    private MerchantReviewRecord toMerchantReviewRecord(
            MerchantApplicationEntity applicationEntity,
            SysUserEntity user,
            MemberRealNameAuthEntity authEntity,
            MerchantApplicationAiReportEntity aiReportEntity,
            List<MerchantApplicationDocumentEntity> documentEntities) {
        return new MerchantReviewRecord(
                String.valueOf(applicationEntity.getId()),
                String.valueOf(applicationEntity.getUserId()),
                user == null ? "" : user.getPhone(),
                user == null ? "" : user.getDisplayName(),
                authEntity == null ? "UNSUBMITTED" : authEntity.getStatus(),
                authEntity == null ? "" : authEntity.getRealName(),
                applicationEntity.getStoreName(),
                applicationEntity.getCompanyName(),
                applicationEntity.getContactName(),
                applicationEntity.getBusinessScope(),
                applicationEntity.getStatus(),
                applicationEntity.getReviewRemark(),
                aiReportEntity == null ? "UNKNOWN" : aiReportEntity.getRiskLevel(),
                aiReportEntity == null ? "REVIEW" : aiReportEntity.getRecommendation(),
                aiReportEntity == null ? "AI 报告暂未生成" : aiReportEntity.getAnalysisSummary(),
                aiReportEntity == null ? List.of() : parseCsv(aiReportEntity.getMissingDocumentKeys()),
                aiReportEntity == null ? List.of() : parseCsv(aiReportEntity.getRiskFlags()),
                aiReportEntity == null ? 0 : aiReportEntity.getAuthenticityScore(),
                aiReportEntity == null ? 0 : aiReportEntity.getCompletenessScore(),
                aiReportEntity == null ? 0 : aiReportEntity.getComplianceScore(),
                aiReportEntity == null ? "PENDING" : aiReportEntity.getReportStatus(),
                documentEntities.stream()
                        .map(this::toApplicationDocumentRecord)
                        .toList(),
                applicationEntity.getSubmittedAt(),
                applicationEntity.getReviewedAt(),
                aiReportEntity == null ? null : aiReportEntity.getAnalyzedAt());
    }

    private DistributorEnterpriseRecord toDistributorEnterpriseRecord(
            DistributorEnterpriseEntity entity,
            SysUserEntity user,
            MemberLevelConfigEntity memberLevelEntity,
            List<SysUserEntity> users,
            Map<Long, List<String>> userRolesMap,
            Map<Long, MemberRealNameAuthEntity> authMap,
            Map<Long, MerchantApplicationEntity> applicationMap,
            MerchantApplicationAiReportEntity aiReportEntity,
            List<MerchantApplicationDocumentEntity> documentEntities,
            List<CustomerPortraitSnapshotEntity> enterprisePortraits,
            CustomerPortraitSnapshotEntity fallbackPortrait) {
        List<CustomerPortraitSnapshotEntity> resolvedPortraits = resolveEnterprisePortraits(enterprisePortraits, fallbackPortrait);
        CustomerPortraitSnapshotEntity dominantPortrait = selectDominantPortrait(resolvedPortraits);
        List<AssociatedEnterpriseUserRecord> associatedUsers = buildAssociatedEnterpriseUsers(
                entity,
                users,
                userRolesMap,
                authMap,
                applicationMap,
                resolvedPortraits);

        return new DistributorEnterpriseRecord(
                String.valueOf(entity.getId()),
                entity.getEnterpriseNo(),
                entity.getUserId() == null ? null : String.valueOf(entity.getUserId()),
                entity.getApplicationId() == null ? null : String.valueOf(entity.getApplicationId()),
                entity.getSourceType(),
                user == null ? "" : user.getPhone(),
                user == null ? "" : user.getDisplayName(),
                entity.getCompanyName(),
                entity.getStoreName(),
                entity.getContactName(),
                entity.getContactPhone(),
                entity.getBusinessScope(),
                Boolean.TRUE.equals(entity.getEnabled()),
                entity.getReviewRemark(),
                entity.getMemberLevelKey(),
                memberLevelEntity == null ? "" : memberLevelEntity.getLevelName(),
                dominantPortrait == null ? "" : dominantPortrait.getSegmentCode(),
                dominantPortrait == null ? "" : dominantPortrait.getSegmentName(),
                mergePortraitCategories(resolvedPortraits),
                sumPickupFrequency(resolvedPortraits),
                averageOrderAmount(resolvedPortraits),
                averageRepaymentDays(resolvedPortraits),
                dominantPortrait == null ? "" : dominantPortrait.getRecommendedPolicy(),
                mergePortraitPolicyTags(resolvedPortraits),
                dominantPortrait == null ? "PENDING" : dominantPortrait.getExternalDataStatus(),
                dominantPortrait == null ? PORTRAIT_EXTERNAL_ENDPOINT : dominantPortrait.getExternalDataEndpoint(),
                latestPortraitSyncAt(resolvedPortraits),
                entity.getApplicationId() == null ? "NONE" : findApplicationStatus(applicationMap, entity.getApplicationId()),
                aiReportEntity == null ? "UNKNOWN" : aiReportEntity.getRiskLevel(),
                aiReportEntity == null ? "REVIEW" : aiReportEntity.getRecommendation(),
                aiReportEntity == null ? "AI 报告暂未生成" : aiReportEntity.getAnalysisSummary(),
                aiReportEntity == null ? List.of() : parseCsv(aiReportEntity.getRiskFlags()),
                aiReportEntity == null ? List.of() : parseCsv(aiReportEntity.getMissingDocumentKeys()),
                aiReportEntity == null ? 0 : aiReportEntity.getAuthenticityScore(),
                aiReportEntity == null ? 0 : aiReportEntity.getCompletenessScore(),
                aiReportEntity == null ? 0 : aiReportEntity.getComplianceScore(),
                documentEntities.stream()
                        .map(this::toApplicationDocumentRecord)
                        .toList(),
                associatedUsers,
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getApplicationId() == null ? null : findApplicationSubmittedAt(applicationMap, entity.getApplicationId()),
                entity.getApplicationId() == null ? null : findApplicationReviewedAt(applicationMap, entity.getApplicationId()),
                aiReportEntity == null ? null : aiReportEntity.getAnalyzedAt());
    }

    private List<CustomerPortraitSnapshotEntity> resolveEnterprisePortraits(
            List<CustomerPortraitSnapshotEntity> enterprisePortraits,
            CustomerPortraitSnapshotEntity fallbackPortrait) {
        if (enterprisePortraits != null && !enterprisePortraits.isEmpty()) {
            return enterprisePortraits;
        }
        if (fallbackPortrait == null) {
            return List.of();
        }
        return List.of(fallbackPortrait);
    }

    private CustomerPortraitSnapshotEntity selectDominantPortrait(List<CustomerPortraitSnapshotEntity> portraits) {
        return portraits.stream()
                .max(Comparator
                        .comparingInt((CustomerPortraitSnapshotEntity portrait) -> segmentPriority(portrait.getSegmentCode()))
                        .thenComparing(
                                CustomerPortraitSnapshotEntity::getAvgOrderAmount,
                                Comparator.nullsLast(BigDecimal::compareTo))
                        .thenComparing(
                                CustomerPortraitSnapshotEntity::getLastSyncedAt,
                                Comparator.nullsLast(LocalDateTime::compareTo)))
                .orElse(null);
    }

    private int segmentPriority(String segmentCode) {
        if ("KEY_ACCOUNT".equals(segmentCode)) {
            return 3;
        }
        if ("POTENTIAL_STORE".equals(segmentCode)) {
            return 2;
        }
        if ("LOW_FREQUENCY".equals(segmentCode)) {
            return 1;
        }
        return 0;
    }

    private List<String> mergePortraitCategories(List<CustomerPortraitSnapshotEntity> portraits) {
        return portraits.stream()
                .flatMap(portrait -> parseCsv(portrait.getPrimaryCategories()).stream())
                .distinct()
                .toList();
    }

    private List<String> mergePortraitPolicyTags(List<CustomerPortraitSnapshotEntity> portraits) {
        return portraits.stream()
                .flatMap(portrait -> parseCsv(portrait.getPolicyTags()).stream())
                .distinct()
                .toList();
    }

    private BigDecimal sumPickupFrequency(List<CustomerPortraitSnapshotEntity> portraits) {
        BigDecimal total = portraits.stream()
                .map(CustomerPortraitSnapshotEntity::getPickupFrequencyPerMonth)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return BigDecimal.ZERO.compareTo(total) == 0 ? null : total;
    }

    private BigDecimal averageOrderAmount(List<CustomerPortraitSnapshotEntity> portraits) {
        List<BigDecimal> amounts = portraits.stream()
                .map(CustomerPortraitSnapshotEntity::getAvgOrderAmount)
                .filter(Objects::nonNull)
                .toList();
        if (amounts.isEmpty()) {
            return null;
        }
        BigDecimal total = amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(amounts.size()), 2, RoundingMode.HALF_UP);
    }

    private Integer averageRepaymentDays(List<CustomerPortraitSnapshotEntity> portraits) {
        List<Integer> repaymentDays = portraits.stream()
                .map(CustomerPortraitSnapshotEntity::getRepaymentDays)
                .filter(Objects::nonNull)
                .toList();
        if (repaymentDays.isEmpty()) {
            return null;
        }
        double average = repaymentDays.stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0);
        return (int) Math.round(average);
    }

    private LocalDateTime latestPortraitSyncAt(List<CustomerPortraitSnapshotEntity> portraits) {
        return portraits.stream()
                .map(CustomerPortraitSnapshotEntity::getLastSyncedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }

    private String findApplicationStatus(Map<Long, MerchantApplicationEntity> applicationMap, Long applicationId) {
        return applicationMap.values().stream()
                .filter(application -> Objects.equals(application.getId(), applicationId))
                .map(MerchantApplicationEntity::getStatus)
                .findFirst()
                .orElse("NONE");
    }

    private LocalDateTime findApplicationSubmittedAt(Map<Long, MerchantApplicationEntity> applicationMap, Long applicationId) {
        return applicationMap.values().stream()
                .filter(application -> Objects.equals(application.getId(), applicationId))
                .map(MerchantApplicationEntity::getSubmittedAt)
                .findFirst()
                .orElse(null);
    }

    private LocalDateTime findApplicationReviewedAt(Map<Long, MerchantApplicationEntity> applicationMap, Long applicationId) {
        return applicationMap.values().stream()
                .filter(application -> Objects.equals(application.getId(), applicationId))
                .map(MerchantApplicationEntity::getReviewedAt)
                .findFirst()
                .orElse(null);
    }

    private List<AssociatedEnterpriseUserRecord> buildAssociatedEnterpriseUsers(
            DistributorEnterpriseEntity enterpriseEntity,
            List<SysUserEntity> users,
            Map<Long, List<String>> userRolesMap,
            Map<Long, MemberRealNameAuthEntity> authMap,
            Map<Long, MerchantApplicationEntity> applicationMap,
            List<CustomerPortraitSnapshotEntity> portraits) {
        Set<Long> userIds = new LinkedHashSet<>();
        if (enterpriseEntity.getUserId() != null) {
            userIds.add(enterpriseEntity.getUserId());
        }
        users.stream()
                .filter(user -> Objects.equals(user.getEnterpriseId(), enterpriseEntity.getId()))
                .map(SysUserEntity::getId)
                .filter(Objects::nonNull)
                .forEach(userIds::add);
        portraits.stream()
                .map(CustomerPortraitSnapshotEntity::getUserId)
                .filter(Objects::nonNull)
                .forEach(userIds::add);

        return userIds.stream()
                .map(userId -> findUser(users, userId))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(SysUserEntity::getCreatedAt).reversed())
                .map(user -> toAssociatedEnterpriseUserRecord(
                        user,
                        userRolesMap.getOrDefault(user.getId(), List.of()),
                        authMap.get(user.getId()),
                        applicationMap.get(user.getId())))
                .toList();
    }

    private AssociatedEnterpriseUserRecord toAssociatedEnterpriseUserRecord(
            SysUserEntity user,
            List<String> roleCodes,
            MemberRealNameAuthEntity authEntity,
            MerchantApplicationEntity applicationEntity) {
        return new AssociatedEnterpriseUserRecord(
                String.valueOf(user.getId()),
                user.getPhone(),
                user.getDisplayName(),
                Boolean.TRUE.equals(user.getEnabled()),
                roleCodes,
                authEntity == null ? "UNSUBMITTED" : authEntity.getStatus(),
                authEntity == null ? "" : authEntity.getRealName(),
                applicationEntity == null ? "NONE" : applicationEntity.getStatus(),
                user.getCreatedAt());
    }

    private ApplicationDocumentRecord toApplicationDocumentRecord(MerchantApplicationDocumentEntity entity) {
        return new ApplicationDocumentRecord(
                entity.getDocumentKey(),
                entity.getDocumentName(),
                entity.getDocumentNo(),
                entity.getAuthenticityStatus(),
                entity.getExpiryDate(),
                entity.getExpiryStatus(),
                entity.getDocumentStatus(),
                entity.getRiskNote());
    }

    private MemberLevelConfigRecord toMemberLevelConfigRecord(MemberLevelConfigEntity entity) {
        return new MemberLevelConfigRecord(
                String.valueOf(entity.getId()),
                entity.getLevelKey(),
                entity.getLevelName(),
                entity.getLevelRank(),
                entity.getLevelTitle(),
                entity.getLevelDescription(),
                entity.getSummaryText(),
                entity.getProgressText(),
                entity.getMissionText(),
                entity.getMissionAction(),
                entity.getHighlightTitle(),
                entity.getVisualSrc(),
                entity.getHeroStart(),
                entity.getHeroMid(),
                entity.getHeroEnd(),
                entity.getAccent(),
                entity.getSoftAccent(),
                entity.getCardSurface(),
                entity.getPlaceholderTone(),
                entity.getGlowColor(),
                entity.getSparkColor(),
                entity.getProgressPercent(),
                parseCsv(entity.getHighlightKeys()),
                parseCsv(entity.getBenefitKeys()),
                Boolean.TRUE.equals(entity.getEnabled()),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    private List<String> parseCsv(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .toList();
    }

    private String joinCsv(List<String> values) {
        return values == null ? "" : values.stream()
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .collect(Collectors.joining(","));
    }

    private Long parseNullableLong(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Long.parseLong(value);
    }

    private String parseNullableString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String nextEnterpriseNo() {
        long count = distributorEnterpriseMapper.selectCount(new LambdaQueryWrapper<DistributorEnterpriseEntity>()
                .eq(DistributorEnterpriseEntity::getDeleted, false));
        return "SME" + (LocalDate.now().getYear()) + String.format("%04d", count + 1);
    }

    public record UserCenterBootstrapPayload(
            List<CustomerRecord> users,
            List<MerchantReviewRecord> reviews,
            List<DistributorEnterpriseRecord> enterprises,
            List<MemberLevelConfigRecord> memberLevels,
            List<BenefitOptionRecord> benefitOptions,
            List<HighlightOptionRecord> highlightOptions,
            PortraitExternalDataTemplateRecord portraitExternalDataTemplate) {
    }

    public record PublicMemberCenterConfigPayload(List<MemberLevelConfigRecord> levels) {
    }

    public record CustomerRecord(
            String id,
            String phone,
            String displayName,
            boolean enabled,
            String enterpriseId,
            String enterpriseName,
            List<String> roles,
            String realNameStatus,
            String realName,
            String applicationStatus,
            String enterpriseStatus,
            String portraitSegmentCode,
            String portraitSegmentName,
            List<String> primaryCategories,
            BigDecimal pickupFrequencyPerMonth,
            BigDecimal avgOrderAmount,
            Integer repaymentDays,
            String recommendedPolicy,
            List<String> policyTags,
            String externalDataStatus,
            String externalDataEndpoint,
            LocalDateTime lastPortraitSyncAt,
            LocalDateTime createdAt) {
    }

    public record MerchantReviewRecord(
            String applicationId,
            String userId,
            String phone,
            String displayName,
            String realNameStatus,
            String realName,
            String storeName,
            String companyName,
            String contactName,
            String businessScope,
            String status,
            String reviewRemark,
            String aiRiskLevel,
            String aiRecommendation,
            String aiSummary,
            List<String> missingDocumentKeys,
            List<String> riskFlags,
            int authenticityScore,
            int completenessScore,
            int complianceScore,
            String aiReportStatus,
            List<ApplicationDocumentRecord> documentChecks,
            LocalDateTime submittedAt,
            LocalDateTime reviewedAt,
            LocalDateTime analyzedAt) {
    }

    public record ApplicationDocumentRecord(
            String documentKey,
            String documentName,
            String documentNo,
            String authenticityStatus,
            LocalDate expiryDate,
            String expiryStatus,
            String documentStatus,
            String riskNote) {
    }

    public record DistributorEnterpriseRecord(
            String id,
            String enterpriseNo,
            String userId,
            String applicationId,
            String sourceType,
            String userPhone,
            String userDisplayName,
            String companyName,
            String storeName,
            String contactName,
            String contactPhone,
            String businessScope,
            boolean enabled,
            String reviewRemark,
            String memberLevelKey,
            String memberLevelName,
            String portraitSegmentCode,
            String portraitSegmentName,
            List<String> primaryCategories,
            BigDecimal pickupFrequencyPerMonth,
            BigDecimal avgOrderAmount,
            Integer repaymentDays,
            String recommendedPolicy,
            List<String> policyTags,
            String externalDataStatus,
            String externalDataEndpoint,
            LocalDateTime lastPortraitSyncAt,
            String applicationStatus,
            String aiRiskLevel,
            String aiRecommendation,
            String aiSummary,
            List<String> riskFlags,
            List<String> missingDocumentKeys,
            int authenticityScore,
            int completenessScore,
            int complianceScore,
            List<ApplicationDocumentRecord> documentChecks,
            List<AssociatedEnterpriseUserRecord> associatedUsers,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            LocalDateTime submittedAt,
            LocalDateTime reviewedAt,
            LocalDateTime analyzedAt) {
    }

    public record AssociatedEnterpriseUserRecord(
            String id,
            String phone,
            String displayName,
            boolean enabled,
            List<String> roles,
            String realNameStatus,
            String realName,
            String applicationStatus,
            LocalDateTime createdAt) {
    }

    public record MemberLevelConfigRecord(
            String id,
            String levelKey,
            String levelName,
            int levelRank,
            String levelTitle,
            String levelDescription,
            String summaryText,
            String progressText,
            String missionText,
            String missionAction,
            String highlightTitle,
            String visualSrc,
            String heroStart,
            String heroMid,
            String heroEnd,
            String accent,
            String softAccent,
            String cardSurface,
            String placeholderTone,
            String glowColor,
            String sparkColor,
            int progressPercent,
            List<String> highlightKeys,
            List<String> benefitKeys,
            boolean enabled,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    public record BenefitOptionRecord(String key, String group, String title) {
    }

    public record HighlightOptionRecord(String key, String title) {
    }

    public record PortraitExternalDataTemplateRecord(
            String providerName,
            String method,
            String endpoint,
            List<String> requiredFields,
            String note) {
    }

    public record UserUpsertRequest(String phone, String displayName, String password, boolean enabled, String enterpriseId) {
    }

    public record ReviewRejectRequest(String reason) {
    }

    public record EnterpriseUpsertRequest(
            String userId,
            String applicationId,
            String sourceType,
            String companyName,
            String storeName,
            String contactName,
            String contactPhone,
            String businessScope,
            boolean enabled,
            String reviewRemark,
            String memberLevelKey) {
    }

    public record MemberLevelUpsertRequest(
            String levelKey,
            String levelName,
            int levelRank,
            String levelTitle,
            String levelDescription,
            String summaryText,
            String progressText,
            String missionText,
            String missionAction,
            String highlightTitle,
            String visualSrc,
            String heroStart,
            String heroMid,
            String heroEnd,
            String accent,
            String softAccent,
            String cardSurface,
            String placeholderTone,
            String glowColor,
            String sparkColor,
            int progressPercent,
            List<String> highlightKeys,
            List<String> benefitKeys,
            boolean enabled) {
    }
}
