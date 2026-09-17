package com.saimeng.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.saimeng.admin.entity.CustomerPortraitSnapshotEntity;
import com.saimeng.admin.entity.DistributorEnterpriseEntity;
import com.saimeng.admin.entity.EnterpriseJoinRequestEntity;
import com.saimeng.admin.mapper.CustomerPortraitSnapshotMapper;
import com.saimeng.admin.mapper.DistributorEnterpriseMapper;
import com.saimeng.admin.mapper.EnterpriseJoinRequestMapper;
import com.saimeng.common.BusinessException;
import com.saimeng.member.entity.MemberRealNameAuthEntity;
import com.saimeng.member.mapper.MemberRealNameAuthMapper;
import com.saimeng.merchant.entity.MerchantApplicationEntity;
import com.saimeng.merchant.mapper.MerchantApplicationMapper;
import com.saimeng.system.RoleCodes;
import com.saimeng.system.UserAccountService;
import com.saimeng.system.entity.SysUserEntity;
import com.saimeng.system.entity.SysUserRoleEntity;
import com.saimeng.system.mapper.SysUserMapper;
import com.saimeng.system.mapper.SysUserRoleMapper;
import java.time.LocalDateTime;
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
 * 经销商后台员工管理服务。
 */
@Service
public class DistributorEmployeeService {

    private final SysUserMapper sysUserMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final MemberRealNameAuthMapper memberRealNameAuthMapper;
    private final MerchantApplicationMapper merchantApplicationMapper;
    private final DistributorEnterpriseMapper distributorEnterpriseMapper;
    private final EnterpriseJoinRequestMapper enterpriseJoinRequestMapper;
    private final CustomerPortraitSnapshotMapper customerPortraitSnapshotMapper;
    private final UserAccountService userAccountService;

    public DistributorEmployeeService(
            SysUserMapper sysUserMapper,
            SysUserRoleMapper sysUserRoleMapper,
            MemberRealNameAuthMapper memberRealNameAuthMapper,
            MerchantApplicationMapper merchantApplicationMapper,
            DistributorEnterpriseMapper distributorEnterpriseMapper,
            EnterpriseJoinRequestMapper enterpriseJoinRequestMapper,
            CustomerPortraitSnapshotMapper customerPortraitSnapshotMapper,
            UserAccountService userAccountService) {
        this.sysUserMapper = sysUserMapper;
        this.sysUserRoleMapper = sysUserRoleMapper;
        this.memberRealNameAuthMapper = memberRealNameAuthMapper;
        this.merchantApplicationMapper = merchantApplicationMapper;
        this.distributorEnterpriseMapper = distributorEnterpriseMapper;
        this.enterpriseJoinRequestMapper = enterpriseJoinRequestMapper;
        this.customerPortraitSnapshotMapper = customerPortraitSnapshotMapper;
        this.userAccountService = userAccountService;
    }

    /**
     * 获取当前经销商企业员工列表。
     *
     * @param currentUserId 当前用户 ID
     * @return 初始化数据
     */
    @Transactional(readOnly = true)
    public DistributorEmployeeBootstrapPayload getBootstrap(Long currentUserId) {
        DistributorEnterpriseEntity enterpriseEntity = getCurrentEnterprise(currentUserId);
        List<SysUserEntity> users = listEnterpriseUsers(enterpriseEntity);
        Map<Long, List<String>> userRoleMap = listUserRoleMap();
        Map<Long, MemberRealNameAuthEntity> authMap = listRealNameAuthMap();
        Map<Long, MerchantApplicationEntity> applicationMap = listMerchantApplicationMap();

        List<DistributorEmployeeRecord> employeeRecords = users.stream()
                .sorted(Comparator.comparing(SysUserEntity::getCreatedAt).reversed())
                .map(user -> toRecord(
                        user,
                        userRoleMap.getOrDefault(user.getId(), List.of()),
                        authMap.get(user.getId()),
                        applicationMap.get(user.getId()),
                        enterpriseEntity))
                .toList();

        List<EnterpriseJoinRequestRecord> joinRequestRecords = enterpriseJoinRequestMapper.selectList(
                        new LambdaQueryWrapper<EnterpriseJoinRequestEntity>()
                                .eq(EnterpriseJoinRequestEntity::getEnterpriseId, enterpriseEntity.getId())
                                .eq(EnterpriseJoinRequestEntity::getStatus, "PENDING")
                                .orderByDesc(EnterpriseJoinRequestEntity::getCreatedAt))
                .stream()
                .map(this::toJoinRequestRecord)
                .toList();

        return new DistributorEmployeeBootstrapPayload(
                String.valueOf(enterpriseEntity.getId()),
                enterpriseEntity.getEnterpriseNo(),
                enterpriseEntity.getCompanyName(),
                enterpriseEntity.getStoreName(),
                String.valueOf(currentUserId),
                enterpriseEntity.getUserId() != null && Objects.equals(enterpriseEntity.getUserId(), currentUserId),
                enterpriseEntity.getUserId() == null ? null : String.valueOf(enterpriseEntity.getUserId()),
                enterpriseEntity.getUserId() == null ? "" : getRequiredUser(enterpriseEntity.getUserId()).getDisplayName(),
                joinRequestRecords,
                employeeRecords);
    }

    /**
     * 新增当前企业员工。
     *
     * @param currentUserId 当前用户 ID
     * @param request 请求
     * @return 员工记录
     */
    @Transactional
    public DistributorEmployeeRecord createEmployee(Long currentUserId, DistributorEmployeeUpsertRequest request) {
        DistributorEnterpriseEntity enterpriseEntity = getCurrentEnterprise(currentUserId);
        ensureUserPhoneUnique(request.phone(), null);

        LocalDateTime now = LocalDateTime.now();
        SysUserEntity entity = new SysUserEntity();
        entity.setId(IdWorker.getId());
        entity.setPhone(request.phone());
        entity.setPassword(request.password());
        entity.setDisplayName(request.displayName());
        entity.setEnterpriseId(enterpriseEntity.getId());
        entity.setEnabled(request.enabled());
        entity.setDeleted(false);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        sysUserMapper.insert(entity);

        syncPortraitEnterpriseBinding(entity.getId(), enterpriseEntity.getId());
        userAccountService.addRole(entity.getId(), RoleCodes.DISTRIBUTOR);
        return toRecord(entity, listRoleCodes(entity.getId()), null, null, enterpriseEntity);
    }

    /**
     * 更新当前企业员工。
     *
     * @param currentUserId 当前用户 ID
     * @param userId 用户 ID
     * @param request 请求
     * @return 员工记录
     */
    @Transactional
    public DistributorEmployeeRecord updateEmployee(Long currentUserId, Long userId, DistributorEmployeeUpsertRequest request) {
        DistributorEnterpriseEntity enterpriseEntity = getCurrentEnterprise(currentUserId);
        SysUserEntity entity = getManagedUser(enterpriseEntity, userId);
        ensureUserPhoneUnique(request.phone(), userId);

        entity.setPhone(request.phone());
        entity.setDisplayName(request.displayName());
        entity.setEnterpriseId(enterpriseEntity.getId());
        entity.setEnabled(request.enabled());
        if (request.password() != null && !request.password().isBlank()) {
            entity.setPassword(request.password());
        }
        entity.setUpdatedAt(LocalDateTime.now());
        sysUserMapper.updateById(entity);

        syncPortraitEnterpriseBinding(userId, enterpriseEntity.getId());

        MemberRealNameAuthEntity authEntity = memberRealNameAuthMapper.selectOne(new LambdaQueryWrapper<MemberRealNameAuthEntity>()
                .eq(MemberRealNameAuthEntity::getUserId, userId)
                .last("limit 1"));
        MerchantApplicationEntity applicationEntity = merchantApplicationMapper.selectOne(new LambdaQueryWrapper<MerchantApplicationEntity>()
                .eq(MerchantApplicationEntity::getUserId, userId)
                .last("limit 1"));
        return toRecord(entity, listRoleCodes(userId), authEntity, applicationEntity, enterpriseEntity);
    }

    /**
     * 从当前企业移除员工。
     *
     * @param currentUserId 当前用户 ID
     * @param userId 用户 ID
     */
    @Transactional
    public void deleteEmployee(Long currentUserId, Long userId) {
        DistributorEnterpriseEntity enterpriseEntity = getCurrentEnterprise(currentUserId);
        SysUserEntity entity = getManagedUser(enterpriseEntity, userId);
        if (Objects.equals(enterpriseEntity.getUserId(), userId)) {
            throw new BusinessException("企业主账号不支持在员工管理中移除");
        }

        entity.setEnterpriseId(null);
        entity.setUpdatedAt(LocalDateTime.now());
        sysUserMapper.updateById(entity);
        syncPortraitEnterpriseBinding(userId, null);
        userAccountService.removeRole(userId, RoleCodes.DISTRIBUTOR);
    }

    /**
     * 通过加入企业申请。
     *
     * @param currentUserId 当前用户 ID
     * @param requestId 申请 ID
     */
    @Transactional
    public void approveJoinRequest(Long currentUserId, Long requestId) {
        DistributorEnterpriseEntity enterpriseEntity = getCurrentEnterprise(currentUserId);
        ensureSuperAdmin(enterpriseEntity, currentUserId);
        EnterpriseJoinRequestEntity requestEntity = getManagedJoinRequest(enterpriseEntity.getId(), requestId);
        SysUserEntity applicant = getRequiredUser(requestEntity.getUserId());
        applicant.setEnterpriseId(enterpriseEntity.getId());
        applicant.setUpdatedAt(LocalDateTime.now());
        sysUserMapper.updateById(applicant);
        syncPortraitEnterpriseBinding(applicant.getId(), enterpriseEntity.getId());
        userAccountService.addRole(applicant.getId(), RoleCodes.DISTRIBUTOR);
        requestEntity.setStatus("APPROVED");
        requestEntity.setReviewRemark(null);
        requestEntity.setReviewedAt(LocalDateTime.now());
        enterpriseJoinRequestMapper.updateById(requestEntity);
    }

    /**
     * 驳回加入企业申请。
     *
     * @param currentUserId 当前用户 ID
     * @param requestId 申请 ID
     * @param reviewRemark 驳回原因
     */
    @Transactional
    public void rejectJoinRequest(Long currentUserId, Long requestId, String reviewRemark) {
        DistributorEnterpriseEntity enterpriseEntity = getCurrentEnterprise(currentUserId);
        ensureSuperAdmin(enterpriseEntity, currentUserId);
        EnterpriseJoinRequestEntity requestEntity = getManagedJoinRequest(enterpriseEntity.getId(), requestId);
        requestEntity.setStatus("REJECTED");
        requestEntity.setReviewRemark(reviewRemark);
        requestEntity.setReviewedAt(LocalDateTime.now());
        enterpriseJoinRequestMapper.updateById(requestEntity);
    }

    /**
     * 移交超级管理员。
     *
     * @param currentUserId 当前用户 ID
     * @param targetUserId 目标用户 ID
     */
    @Transactional
    public void transferSuperAdmin(Long currentUserId, Long targetUserId) {
        DistributorEnterpriseEntity enterpriseEntity = getCurrentEnterprise(currentUserId);
        ensureSuperAdmin(enterpriseEntity, currentUserId);
        SysUserEntity targetUser = getManagedUser(enterpriseEntity, targetUserId);
        enterpriseEntity.setUserId(targetUser.getId());
        enterpriseEntity.setUpdatedAt(LocalDateTime.now());
        distributorEnterpriseMapper.updateById(enterpriseEntity);
    }

    private DistributorEnterpriseEntity getCurrentEnterprise(Long currentUserId) {
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
        if (enterpriseEntity == null) {
            throw new BusinessException("当前账号尚未绑定企业，无法查看员工管理");
        }
        return enterpriseEntity;
    }

    private SysUserEntity getManagedUser(DistributorEnterpriseEntity enterpriseEntity, Long userId) {
        SysUserEntity entity = getRequiredUser(userId);
        boolean isOwner = Objects.equals(enterpriseEntity.getUserId(), userId);
        boolean isBoundEmployee = Objects.equals(entity.getEnterpriseId(), enterpriseEntity.getId());
        if (!isOwner && !isBoundEmployee) {
            throw new BusinessException("该员工不属于当前企业");
        }
        return entity;
    }

    private EnterpriseJoinRequestEntity getManagedJoinRequest(Long enterpriseId, Long requestId) {
        EnterpriseJoinRequestEntity entity = enterpriseJoinRequestMapper.selectById(requestId);
        if (entity == null || !Objects.equals(entity.getEnterpriseId(), enterpriseId)) {
            throw new BusinessException("加入申请不存在");
        }
        if (!"PENDING".equals(entity.getStatus())) {
            throw new BusinessException("该加入申请已处理，请刷新后查看");
        }
        return entity;
    }

    private void ensureSuperAdmin(DistributorEnterpriseEntity enterpriseEntity, Long currentUserId) {
        if (!Objects.equals(enterpriseEntity.getUserId(), currentUserId)) {
            throw new BusinessException("只有企业超级管理员可以处理该操作");
        }
    }

    private SysUserEntity getRequiredUser(Long userId) {
        SysUserEntity entity = sysUserMapper.selectById(userId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("用户不存在");
        }
        return entity;
    }

    private void ensureUserPhoneUnique(String phone, Long currentUserId) {
        long count = sysUserMapper.selectCount(new LambdaQueryWrapper<SysUserEntity>()
                .eq(SysUserEntity::getPhone, phone)
                .eq(SysUserEntity::getDeleted, false)
                .ne(currentUserId != null, SysUserEntity::getId, currentUserId));
        if (count > 0) {
            throw new BusinessException("手机号已存在");
        }
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

    private List<SysUserEntity> listEnterpriseUsers(DistributorEnterpriseEntity enterpriseEntity) {
        List<SysUserEntity> boundUsers = sysUserMapper.selectList(new LambdaQueryWrapper<SysUserEntity>()
                .eq(SysUserEntity::getEnterpriseId, enterpriseEntity.getId())
                .eq(SysUserEntity::getDeleted, false));
        Map<Long, SysUserEntity> users = new LinkedHashMap<>();
        boundUsers.forEach(user -> users.put(user.getId(), user));
        if (enterpriseEntity.getUserId() != null) {
            SysUserEntity owner = getRequiredUser(enterpriseEntity.getUserId());
            users.put(owner.getId(), owner);
        }
        return List.copyOf(users.values());
    }

    private Map<Long, List<String>> listUserRoleMap() {
        return sysUserRoleMapper.selectList(new LambdaQueryWrapper<SysUserRoleEntity>())
                .stream()
                .collect(Collectors.groupingBy(
                        SysUserRoleEntity::getUserId,
                        LinkedHashMap::new,
                        Collectors.mapping(SysUserRoleEntity::getRoleCode, Collectors.toList())));
    }

    private Map<Long, MemberRealNameAuthEntity> listRealNameAuthMap() {
        return memberRealNameAuthMapper.selectList(new LambdaQueryWrapper<MemberRealNameAuthEntity>())
                .stream()
                .collect(Collectors.toMap(MemberRealNameAuthEntity::getUserId, entity -> entity, (left, right) -> right));
    }

    private Map<Long, MerchantApplicationEntity> listMerchantApplicationMap() {
        return merchantApplicationMapper.selectList(new LambdaQueryWrapper<MerchantApplicationEntity>())
                .stream()
                .collect(Collectors.toMap(MerchantApplicationEntity::getUserId, entity -> entity, (left, right) -> right));
    }

    private List<String> listRoleCodes(Long userId) {
        return sysUserRoleMapper.selectList(new LambdaQueryWrapper<SysUserRoleEntity>()
                        .eq(SysUserRoleEntity::getUserId, userId))
                .stream()
                .map(SysUserRoleEntity::getRoleCode)
                .collect(Collectors.toCollection(LinkedHashSet::new))
                .stream()
                .toList();
    }

    private DistributorEmployeeRecord toRecord(
            SysUserEntity user,
            List<String> roleCodes,
            MemberRealNameAuthEntity authEntity,
            MerchantApplicationEntity applicationEntity,
            DistributorEnterpriseEntity enterpriseEntity) {
        return new DistributorEmployeeRecord(
                String.valueOf(user.getId()),
                user.getPhone(),
                user.getDisplayName(),
                Boolean.TRUE.equals(user.getEnabled()),
                String.valueOf(enterpriseEntity.getId()),
                enterpriseEntity.getCompanyName(),
                roleCodes,
                authEntity == null ? "UNSUBMITTED" : authEntity.getStatus(),
                authEntity == null ? "" : authEntity.getRealName(),
                applicationEntity == null ? "NONE" : applicationEntity.getStatus(),
                Boolean.TRUE.equals(enterpriseEntity.getEnabled()) ? "ENABLED" : "DISABLED",
                user.getCreatedAt());
    }

    private EnterpriseJoinRequestRecord toJoinRequestRecord(EnterpriseJoinRequestEntity entity) {
        return new EnterpriseJoinRequestRecord(
                String.valueOf(entity.getId()),
                String.valueOf(entity.getEnterpriseId()),
                String.valueOf(entity.getUserId()),
                entity.getApplicantName(),
                entity.getApplicantPhone(),
                entity.getPosition(),
                entity.getApplyRemark(),
                entity.getStatus(),
                entity.getReviewRemark(),
                entity.getCreatedAt(),
                entity.getReviewedAt());
    }

    public record DistributorEmployeeBootstrapPayload(
            String enterpriseId,
            String enterpriseNo,
            String companyName,
            String storeName,
            String currentUserId,
            boolean currentUserIsSuperAdmin,
            String superAdminUserId,
            String superAdminName,
            List<EnterpriseJoinRequestRecord> joinRequests,
            List<DistributorEmployeeRecord> employees) {
    }

    public record DistributorEmployeeRecord(
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
            LocalDateTime createdAt) {
    }

    public record EnterpriseJoinRequestRecord(
            String requestId,
            String enterpriseId,
            String userId,
            String applicantName,
            String applicantPhone,
            String position,
            String applyRemark,
            String status,
            String reviewRemark,
            LocalDateTime createdAt,
            LocalDateTime reviewedAt) {
    }

    public record DistributorEmployeeUpsertRequest(
            String phone,
            String displayName,
            String password,
            boolean enabled) {
    }

    public record JoinRequestReviewRequest(String reviewRemark) {
    }
}
