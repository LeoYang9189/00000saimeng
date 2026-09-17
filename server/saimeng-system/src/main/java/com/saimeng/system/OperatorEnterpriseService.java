package com.saimeng.system;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.saimeng.common.BusinessException;
import com.saimeng.system.entity.OperatorAccountEntity;
import com.saimeng.system.entity.OperatorDepartmentEntity;
import com.saimeng.system.entity.OperatorEmployeeEntity;
import com.saimeng.system.entity.OperatorEmployeeRoleEntity;
import com.saimeng.system.entity.OperatorPermissionEntity;
import com.saimeng.system.entity.OperatorRoleEntity;
import com.saimeng.system.entity.OperatorRolePermissionEntity;
import com.saimeng.system.mapper.OperatorAccountMapper;
import com.saimeng.system.mapper.OperatorDepartmentMapper;
import com.saimeng.system.mapper.OperatorEmployeeMapper;
import com.saimeng.system.mapper.OperatorEmployeeRoleMapper;
import com.saimeng.system.mapper.OperatorPermissionMapper;
import com.saimeng.system.mapper.OperatorRoleMapper;
import com.saimeng.system.mapper.OperatorRolePermissionMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
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
 * 运营后台企业中心服务。
 */
@Service
public class OperatorEnterpriseService {

    private final OperatorDepartmentMapper operatorDepartmentMapper;
    private final OperatorEmployeeMapper operatorEmployeeMapper;
    private final OperatorAccountMapper operatorAccountMapper;
    private final OperatorRoleMapper operatorRoleMapper;
    private final OperatorPermissionMapper operatorPermissionMapper;
    private final OperatorRolePermissionMapper operatorRolePermissionMapper;
    private final OperatorEmployeeRoleMapper operatorEmployeeRoleMapper;

    public OperatorEnterpriseService(
            OperatorDepartmentMapper operatorDepartmentMapper,
            OperatorEmployeeMapper operatorEmployeeMapper,
            OperatorAccountMapper operatorAccountMapper,
            OperatorRoleMapper operatorRoleMapper,
            OperatorPermissionMapper operatorPermissionMapper,
            OperatorRolePermissionMapper operatorRolePermissionMapper,
            OperatorEmployeeRoleMapper operatorEmployeeRoleMapper) {
        this.operatorDepartmentMapper = operatorDepartmentMapper;
        this.operatorEmployeeMapper = operatorEmployeeMapper;
        this.operatorAccountMapper = operatorAccountMapper;
        this.operatorRoleMapper = operatorRoleMapper;
        this.operatorPermissionMapper = operatorPermissionMapper;
        this.operatorRolePermissionMapper = operatorRolePermissionMapper;
        this.operatorEmployeeRoleMapper = operatorEmployeeRoleMapper;
    }

    /**
     * 运营员工登录。
     *
     * @param account  账号
     * @param password 密码
     * @return 用户概要
     */
    @Transactional
    public UserProfile loginOperator(String account, String password) {
        OperatorAccountEntity accountEntity = operatorAccountMapper.selectOne(new LambdaQueryWrapper<OperatorAccountEntity>()
                .eq(OperatorAccountEntity::getAccount, account)
                .eq(OperatorAccountEntity::getDeleted, false)
                .last("LIMIT 1"));
        if (accountEntity == null || !Objects.equals(accountEntity.getPassword(), password)) {
            throw new BusinessException("账号或密码错误");
        }
        if (!Boolean.TRUE.equals(accountEntity.getEnabled())) {
            throw new BusinessException("当前员工账号已停用");
        }

        OperatorEmployeeEntity employeeEntity = getRequiredEmployee(accountEntity.getEmployeeId());
        if ("DISABLED".equals(employeeEntity.getStatus())) {
            throw new BusinessException("当前员工已停用，无法登录运营后台");
        }

        Set<String> roleCodes = getEmployeeRoleCodes(employeeEntity.getId());
        if (roleCodes.isEmpty()) {
            throw new BusinessException("当前员工未分配任何角色，无法登录运营后台");
        }
        if (!roleCodes.contains(RoleCodes.OPERATOR_ADMIN)) {
            roleCodes.add(RoleCodes.OPERATOR_STAFF);
        }

        accountEntity.setLastLoginAt(LocalDateTime.now());
        accountEntity.setUpdatedAt(LocalDateTime.now());
        operatorAccountMapper.updateById(accountEntity);

        return new UserProfile(
                employeeEntity.getId(),
                accountEntity.getAccount(),
                employeeEntity.getName(),
                roleCodes,
                employeeEntity.getCreatedAt());
    }

    /**
     * 获取企业中心全量初始化数据。
     *
     * @param employeeId 当前登录员工 ID
     * @return 初始化数据
     */
    @Transactional(readOnly = true)
    public OperatorEnterpriseBootstrapPayload getBootstrap(Long employeeId) {
        List<OperatorDepartmentEntity> departments = listDepartments();
        List<OperatorPermissionEntity> permissions = listPermissions();
        List<OperatorRoleEntity> roles = listRoles();
        List<OperatorEmployeeEntity> employees = listEmployees();
        List<OperatorAccountEntity> accounts = listAccounts();
        List<OperatorEmployeeRoleEntity> employeeRoles = listEmployeeRoles();
        List<OperatorRolePermissionEntity> rolePermissions = listRolePermissions();

        Map<Long, OperatorAccountEntity> accountMap = accounts.stream()
                .collect(Collectors.toMap(OperatorAccountEntity::getEmployeeId, account -> account));
        Map<Long, List<Long>> employeeRoleIdsMap = employeeRoles.stream()
                .collect(Collectors.groupingBy(
                        OperatorEmployeeRoleEntity::getEmployeeId,
                        Collectors.mapping(OperatorEmployeeRoleEntity::getRoleId, Collectors.toList())));
        Map<Long, List<Long>> rolePermissionIdsMap = rolePermissions.stream()
                .collect(Collectors.groupingBy(
                        OperatorRolePermissionEntity::getRoleId,
                        Collectors.mapping(OperatorRolePermissionEntity::getPermissionId, Collectors.toList())));
        Map<Long, OperatorPermissionEntity> permissionMap = permissions.stream()
                .collect(Collectors.toMap(OperatorPermissionEntity::getId, permission -> permission));

        List<OperatorRoleRecord> roleRecords = roles.stream()
                .sorted(Comparator.comparing(OperatorRoleEntity::getCreatedAt))
                .map(role -> new OperatorRoleRecord(
                        String.valueOf(role.getId()),
                        role.getName(),
                        role.getCode(),
                        role.getDescription(),
                        rolePermissionIdsMap.getOrDefault(role.getId(), List.of()).stream()
                                .map(permissionMap::get)
                                .filter(Objects::nonNull)
                                .map(OperatorPermissionEntity::getPermissionKey)
                                .toList(),
                        Boolean.TRUE.equals(role.getIsBuiltIn())))
                .toList();

        List<OperatorEmployeeRecord> employeeRecords = employees.stream()
                .sorted(Comparator.comparing(OperatorEmployeeEntity::getUpdatedAt).reversed())
                .map(employee -> toEmployeeRecord(
                        employee,
                        accountMap.get(employee.getId()),
                        employeeRoleIdsMap.getOrDefault(employee.getId(), List.of())))
                .toList();

        OperatorEmployeeRecord currentEmployee = employeeRecords.stream()
                .filter(employee -> employee.id().equals(String.valueOf(employeeId)))
                .findFirst()
                .orElseThrow(() -> new BusinessException("当前员工不存在"));

        List<OperatorDepartmentRecord> departmentRecords = departments.stream()
                .sorted(Comparator.comparing(OperatorDepartmentEntity::getSortOrder))
                .map(department -> new OperatorDepartmentRecord(
                        String.valueOf(department.getId()),
                        department.getParentId() == null ? null : String.valueOf(department.getParentId()),
                        department.getName(),
                        department.getCode(),
                        department.getManagerEmployeeId() == null ? null : String.valueOf(department.getManagerEmployeeId()),
                        department.getDescription(),
                        department.getSortOrder()))
                .toList();

        return new OperatorEnterpriseBootstrapPayload(
                currentEmployee,
                employeeRecords,
                roleRecords,
                buildPermissionTree(permissions),
                departmentRecords);
    }

    /**
     * 创建员工。
     *
     * @param request 请求
     * @return 员工记录
     */
    @Transactional
    public OperatorEmployeeRecord createEmployee(OperatorEmployeeUpsertRequest request) {
        validateEmployeeRequest(request, null);

        LocalDateTime now = LocalDateTime.now();
        Long employeeId = IdWorker.getId();
        OperatorEmployeeEntity employeeEntity = new OperatorEmployeeEntity();
        employeeEntity.setId(employeeId);
        applyEmployeeValues(employeeEntity, request);
        employeeEntity.setDeleted(false);
        employeeEntity.setCreatedAt(now);
        employeeEntity.setUpdatedAt(now);
        operatorEmployeeMapper.insert(employeeEntity);

        OperatorAccountEntity accountEntity = new OperatorAccountEntity();
        accountEntity.setId(IdWorker.getId());
        accountEntity.setEmployeeId(employeeId);
        accountEntity.setAccount(request.account());
        accountEntity.setPassword(request.password() == null || request.password().isBlank() ? "123456" : request.password());
        accountEntity.setEnabled(request.accountEnabled());
        accountEntity.setDeleted(false);
        accountEntity.setCreatedAt(now);
        accountEntity.setUpdatedAt(now);
        operatorAccountMapper.insert(accountEntity);

        replaceEmployeeRoles(employeeId, parseLongIds(request.roleIds()));
        return toEmployeeRecord(employeeEntity, accountEntity, parseLongIds(request.roleIds()));
    }

    /**
     * 更新员工。
     *
     * @param employeeId 员工 ID
     * @param request    请求
     * @return 员工记录
     */
    @Transactional
    public OperatorEmployeeRecord updateEmployee(Long employeeId, OperatorEmployeeUpsertRequest request) {
        OperatorEmployeeEntity employeeEntity = getRequiredEmployee(employeeId);
        OperatorAccountEntity accountEntity = getRequiredAccountByEmployeeId(employeeId);
        validateEmployeeRequest(request, employeeId);

        applyEmployeeValues(employeeEntity, request);
        employeeEntity.setUpdatedAt(LocalDateTime.now());
        operatorEmployeeMapper.updateById(employeeEntity);

        accountEntity.setAccount(request.account());
        if (request.password() != null && !request.password().isBlank()) {
            accountEntity.setPassword(request.password());
        }
        accountEntity.setEnabled(request.accountEnabled());
        accountEntity.setUpdatedAt(LocalDateTime.now());
        operatorAccountMapper.updateById(accountEntity);

        List<Long> roleIds = parseLongIds(request.roleIds());
        replaceEmployeeRoles(employeeId, roleIds);
        return toEmployeeRecord(employeeEntity, accountEntity, roleIds);
    }

    /**
     * 删除员工。
     *
     * @param employeeId 员工 ID
     */
    @Transactional
    public void deleteEmployee(Long employeeId) {
        OperatorEmployeeEntity employeeEntity = getRequiredEmployee(employeeId);
        OperatorAccountEntity accountEntity = getRequiredAccountByEmployeeId(employeeId);
        employeeEntity.setDeleted(true);
        employeeEntity.setUpdatedAt(LocalDateTime.now());
        operatorEmployeeMapper.updateById(employeeEntity);
        accountEntity.setDeleted(true);
        accountEntity.setEnabled(false);
        accountEntity.setUpdatedAt(LocalDateTime.now());
        operatorAccountMapper.updateById(accountEntity);
        operatorEmployeeRoleMapper.delete(new LambdaQueryWrapper<OperatorEmployeeRoleEntity>()
                .eq(OperatorEmployeeRoleEntity::getEmployeeId, employeeId));
    }

    /**
     * 创建角色。
     *
     * @param request 请求
     * @return 角色记录
     */
    @Transactional
    public OperatorRoleRecord createRole(OperatorRoleUpsertRequest request) {
        validateRoleRequest(request, null);
        LocalDateTime now = LocalDateTime.now();
        OperatorRoleEntity roleEntity = new OperatorRoleEntity();
        roleEntity.setId(IdWorker.getId());
        roleEntity.setName(request.name());
        roleEntity.setCode(request.code());
        roleEntity.setDescription(request.description());
        roleEntity.setIsBuiltIn(false);
        roleEntity.setDeleted(false);
        roleEntity.setCreatedAt(now);
        roleEntity.setUpdatedAt(now);
        operatorRoleMapper.insert(roleEntity);
        replaceRolePermissions(roleEntity.getId(), findPermissionIdsByKeys(request.permissionKeys()));
        return new OperatorRoleRecord(
                String.valueOf(roleEntity.getId()),
                roleEntity.getName(),
                roleEntity.getCode(),
                roleEntity.getDescription(),
                request.permissionKeys(),
                false);
    }

    /**
     * 更新角色。
     *
     * @param roleId 角色 ID
     * @param request 请求
     * @return 角色记录
     */
    @Transactional
    public OperatorRoleRecord updateRole(Long roleId, OperatorRoleUpsertRequest request) {
        OperatorRoleEntity roleEntity = getRequiredRole(roleId);
        validateRoleRequest(request, roleId);
        roleEntity.setName(request.name());
        roleEntity.setCode(request.code());
        roleEntity.setDescription(request.description());
        roleEntity.setUpdatedAt(LocalDateTime.now());
        operatorRoleMapper.updateById(roleEntity);
        replaceRolePermissions(roleId, findPermissionIdsByKeys(request.permissionKeys()));
        return new OperatorRoleRecord(
                String.valueOf(roleEntity.getId()),
                roleEntity.getName(),
                roleEntity.getCode(),
                roleEntity.getDescription(),
                request.permissionKeys(),
                Boolean.TRUE.equals(roleEntity.getIsBuiltIn()));
    }

    /**
     * 删除角色。
     *
     * @param roleId 角色 ID
     */
    @Transactional
    public void deleteRole(Long roleId) {
        OperatorRoleEntity roleEntity = getRequiredRole(roleId);
        if (Boolean.TRUE.equals(roleEntity.getIsBuiltIn())) {
            throw new BusinessException("内置角色不允许删除");
        }
        roleEntity.setDeleted(true);
        roleEntity.setUpdatedAt(LocalDateTime.now());
        operatorRoleMapper.updateById(roleEntity);
        operatorRolePermissionMapper.delete(new LambdaQueryWrapper<OperatorRolePermissionEntity>()
                .eq(OperatorRolePermissionEntity::getRoleId, roleId));
        operatorEmployeeRoleMapper.delete(new LambdaQueryWrapper<OperatorEmployeeRoleEntity>()
                .eq(OperatorEmployeeRoleEntity::getRoleId, roleId));
    }

    /**
     * 更新角色权限。
     *
     * @param roleId 角色 ID
     * @param request 请求
     */
    @Transactional
    public void updateRolePermissions(Long roleId, OperatorRolePermissionUpdateRequest request) {
        getRequiredRole(roleId);
        replaceRolePermissions(roleId, findPermissionIdsByKeys(request.permissionKeys()));
    }

    /**
     * 创建部门。
     *
     * @param request 请求
     * @return 部门记录
     */
    @Transactional
    public OperatorDepartmentRecord createDepartment(OperatorDepartmentUpsertRequest request) {
        validateDepartmentRequest(request, null);
        OperatorDepartmentEntity entity = new OperatorDepartmentEntity();
        entity.setId(IdWorker.getId());
        applyDepartmentValues(entity, request);
        entity.setDeleted(false);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        operatorDepartmentMapper.insert(entity);
        return toDepartmentRecord(entity);
    }

    /**
     * 更新部门。
     *
     * @param departmentId 部门 ID
     * @param request      请求
     * @return 部门记录
     */
    @Transactional
    public OperatorDepartmentRecord updateDepartment(Long departmentId, OperatorDepartmentUpsertRequest request) {
        OperatorDepartmentEntity entity = getRequiredDepartment(departmentId);
        validateDepartmentRequest(request, departmentId);
        applyDepartmentValues(entity, request);
        entity.setUpdatedAt(LocalDateTime.now());
        operatorDepartmentMapper.updateById(entity);
        return toDepartmentRecord(entity);
    }

    /**
     * 删除部门。
     *
     * @param departmentId 部门 ID
     */
    @Transactional
    public void deleteDepartment(Long departmentId) {
        OperatorDepartmentEntity entity = getRequiredDepartment(departmentId);
        boolean hasChildren = operatorDepartmentMapper.selectCount(new LambdaQueryWrapper<OperatorDepartmentEntity>()
                .eq(OperatorDepartmentEntity::getParentId, departmentId)
                .eq(OperatorDepartmentEntity::getDeleted, false)) > 0;
        if (hasChildren) {
            throw new BusinessException("当前部门下仍有子部门，无法删除");
        }
        boolean hasEmployees = operatorEmployeeMapper.selectCount(new LambdaQueryWrapper<OperatorEmployeeEntity>()
                .eq(OperatorEmployeeEntity::getDepartmentId, departmentId)
                .eq(OperatorEmployeeEntity::getDeleted, false)) > 0;
        if (hasEmployees) {
            throw new BusinessException("当前部门下仍有员工，无法删除");
        }
        entity.setDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
        operatorDepartmentMapper.updateById(entity);
    }

    /**
     * 获取当前员工完整档案。
     *
     * @param employeeId 员工 ID
     * @return 员工记录
     */
    @Transactional(readOnly = true)
    public OperatorEmployeeRecord getCurrentEmployee(Long employeeId) {
        OperatorEmployeeEntity employeeEntity = getRequiredEmployee(employeeId);
        OperatorAccountEntity accountEntity = getRequiredAccountByEmployeeId(employeeId);
        List<Long> roleIds = operatorEmployeeRoleMapper.selectList(new LambdaQueryWrapper<OperatorEmployeeRoleEntity>()
                        .eq(OperatorEmployeeRoleEntity::getEmployeeId, employeeId))
                .stream()
                .map(OperatorEmployeeRoleEntity::getRoleId)
                .toList();
        return toEmployeeRecord(employeeEntity, accountEntity, roleIds);
    }

    /**
     * 更新当前员工个人资料。
     *
     * @param employeeId 员工 ID
     * @param request    请求
     * @return 最新档案
     */
    @Transactional
    public OperatorEmployeeRecord updateOwnProfile(Long employeeId, OperatorEmployeeProfileUpdateRequest request) {
        OperatorEmployeeEntity employeeEntity = getRequiredEmployee(employeeId);
        employeeEntity.setName(request.name());
        employeeEntity.setPhone(request.phone());
        employeeEntity.setEmail(request.email());
        employeeEntity.setPosition(request.position());
        employeeEntity.setAddress(request.address());
        employeeEntity.setBio(request.bio());
        employeeEntity.setEmergencyContact(request.emergencyContact());
        employeeEntity.setEmergencyPhone(request.emergencyPhone());
        employeeEntity.setUpdatedAt(LocalDateTime.now());
        operatorEmployeeMapper.updateById(employeeEntity);
        return getCurrentEmployee(employeeId);
    }

    private void applyEmployeeValues(OperatorEmployeeEntity employeeEntity, OperatorEmployeeUpsertRequest request) {
        employeeEntity.setName(request.name());
        employeeEntity.setEmployeeNo(request.employeeNo());
        employeeEntity.setPhone(request.phone());
        employeeEntity.setEmail(request.email());
        employeeEntity.setDepartmentId(parseLong(request.departmentId()));
        employeeEntity.setPosition(request.position());
        employeeEntity.setStatus(request.status());
        employeeEntity.setJoinDate(request.joinDate());
        employeeEntity.setAddress(request.address());
        employeeEntity.setBio(request.bio());
        employeeEntity.setEmergencyContact(request.emergencyContact());
        employeeEntity.setEmergencyPhone(request.emergencyPhone());
    }

    private void applyDepartmentValues(OperatorDepartmentEntity entity, OperatorDepartmentUpsertRequest request) {
        entity.setParentId(parseNullableLong(request.parentId()));
        entity.setName(request.name());
        entity.setCode(request.code());
        entity.setManagerEmployeeId(parseNullableLong(request.managerEmployeeId()));
        entity.setDescription(request.description());
        entity.setSortOrder(request.sortOrder());
    }

    private void validateEmployeeRequest(OperatorEmployeeUpsertRequest request, Long currentEmployeeId) {
        ensureDepartmentExists(request.departmentId());
        ensureRoleIdsExist(request.roleIds());
        ensureEmployeeNoUnique(request.employeeNo(), currentEmployeeId);
        ensureAccountUnique(request.account(), currentEmployeeId);
    }

    private void validateRoleRequest(OperatorRoleUpsertRequest request, Long roleId) {
        boolean duplicateCode = operatorRoleMapper.selectCount(new LambdaQueryWrapper<OperatorRoleEntity>()
                .eq(OperatorRoleEntity::getCode, request.code())
                .eq(OperatorRoleEntity::getDeleted, false)
                .ne(roleId != null, OperatorRoleEntity::getId, roleId)) > 0;
        if (duplicateCode) {
            throw new BusinessException("角色编码已存在");
        }
        boolean duplicateName = operatorRoleMapper.selectCount(new LambdaQueryWrapper<OperatorRoleEntity>()
                .eq(OperatorRoleEntity::getName, request.name())
                .eq(OperatorRoleEntity::getDeleted, false)
                .ne(roleId != null, OperatorRoleEntity::getId, roleId)) > 0;
        if (duplicateName) {
            throw new BusinessException("角色名称已存在");
        }
    }

    private void validateDepartmentRequest(OperatorDepartmentUpsertRequest request, Long departmentId) {
        if (request.parentId() != null && departmentId != null && request.parentId().equals(String.valueOf(departmentId))) {
            throw new BusinessException("上级部门不能选择当前部门本身");
        }
        if (request.parentId() != null) {
            ensureDepartmentExists(request.parentId());
        }
        if (request.managerEmployeeId() != null) {
            getRequiredEmployee(parseLong(request.managerEmployeeId()));
        }
        boolean duplicateCode = operatorDepartmentMapper.selectCount(new LambdaQueryWrapper<OperatorDepartmentEntity>()
                .eq(OperatorDepartmentEntity::getCode, request.code())
                .eq(OperatorDepartmentEntity::getDeleted, false)
                .ne(departmentId != null, OperatorDepartmentEntity::getId, departmentId)) > 0;
        if (duplicateCode) {
            throw new BusinessException("部门编码已存在");
        }
    }

    private void ensureDepartmentExists(String departmentId) {
        getRequiredDepartment(parseLong(departmentId));
    }

    private void ensureRoleIdsExist(List<String> roleIds) {
        List<Long> ids = parseLongIds(roleIds);
        if (ids.isEmpty()) {
            throw new BusinessException("至少需要分配一个角色");
        }
        long count = operatorRoleMapper.selectCount(new LambdaQueryWrapper<OperatorRoleEntity>()
                .in(OperatorRoleEntity::getId, ids)
                .eq(OperatorRoleEntity::getDeleted, false));
        if (count != ids.size()) {
            throw new BusinessException("存在无效角色，请重新选择");
        }
    }

    private void ensureEmployeeNoUnique(String employeeNo, Long currentEmployeeId) {
        long count = operatorEmployeeMapper.selectCount(new LambdaQueryWrapper<OperatorEmployeeEntity>()
                .eq(OperatorEmployeeEntity::getEmployeeNo, employeeNo)
                .eq(OperatorEmployeeEntity::getDeleted, false)
                .ne(currentEmployeeId != null, OperatorEmployeeEntity::getId, currentEmployeeId));
        if (count > 0) {
            throw new BusinessException("员工工号已存在");
        }
    }

    private void ensureAccountUnique(String account, Long currentEmployeeId) {
        LambdaQueryWrapper<OperatorAccountEntity> wrapper = new LambdaQueryWrapper<OperatorAccountEntity>()
                .eq(OperatorAccountEntity::getAccount, account)
                .eq(OperatorAccountEntity::getDeleted, false);
        if (currentEmployeeId != null) {
            wrapper.ne(OperatorAccountEntity::getEmployeeId, currentEmployeeId);
        }
        if (operatorAccountMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("登录账号已存在");
        }
    }

    private void replaceEmployeeRoles(Long employeeId, List<Long> roleIds) {
        operatorEmployeeRoleMapper.delete(new LambdaQueryWrapper<OperatorEmployeeRoleEntity>()
                .eq(OperatorEmployeeRoleEntity::getEmployeeId, employeeId));
        for (Long roleId : roleIds) {
            OperatorEmployeeRoleEntity entity = new OperatorEmployeeRoleEntity();
            entity.setId(IdWorker.getId());
            entity.setEmployeeId(employeeId);
            entity.setRoleId(roleId);
            entity.setCreatedAt(LocalDateTime.now());
            operatorEmployeeRoleMapper.insert(entity);
        }
    }

    private void replaceRolePermissions(Long roleId, List<Long> permissionIds) {
        operatorRolePermissionMapper.delete(new LambdaQueryWrapper<OperatorRolePermissionEntity>()
                .eq(OperatorRolePermissionEntity::getRoleId, roleId));
        for (Long permissionId : permissionIds) {
            OperatorRolePermissionEntity entity = new OperatorRolePermissionEntity();
            entity.setId(IdWorker.getId());
            entity.setRoleId(roleId);
            entity.setPermissionId(permissionId);
            entity.setCreatedAt(LocalDateTime.now());
            operatorRolePermissionMapper.insert(entity);
        }
    }

    private List<Long> findPermissionIdsByKeys(List<String> permissionKeys) {
        if (permissionKeys == null || permissionKeys.isEmpty()) {
            return List.of();
        }
        List<OperatorPermissionEntity> permissions = operatorPermissionMapper.selectList(new LambdaQueryWrapper<OperatorPermissionEntity>()
                .in(OperatorPermissionEntity::getPermissionKey, permissionKeys)
                .eq(OperatorPermissionEntity::getDeleted, false));
        if (permissions.size() != new LinkedHashSet<>(permissionKeys).size()) {
            throw new BusinessException("存在无效权限，请重新选择");
        }
        return permissions.stream().map(OperatorPermissionEntity::getId).toList();
    }

    private Set<String> getEmployeeRoleCodes(Long employeeId) {
        List<Long> roleIds = operatorEmployeeRoleMapper.selectList(new LambdaQueryWrapper<OperatorEmployeeRoleEntity>()
                        .eq(OperatorEmployeeRoleEntity::getEmployeeId, employeeId))
                .stream()
                .map(OperatorEmployeeRoleEntity::getRoleId)
                .toList();
        if (roleIds.isEmpty()) {
            return new LinkedHashSet<>();
        }
        return operatorRoleMapper.selectList(new LambdaQueryWrapper<OperatorRoleEntity>()
                        .in(OperatorRoleEntity::getId, roleIds)
                        .eq(OperatorRoleEntity::getDeleted, false))
                .stream()
                .map(OperatorRoleEntity::getCode)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private List<PermissionNodeRecord> buildPermissionTree(List<OperatorPermissionEntity> permissions) {
        Map<Long, List<OperatorPermissionEntity>> childrenMap = permissions.stream()
                .sorted(Comparator.comparing(OperatorPermissionEntity::getSortOrder))
                .collect(Collectors.groupingBy(
                        permission -> permission.getParentId() == null ? 0L : permission.getParentId(),
                        LinkedHashMap::new,
                        Collectors.toList()));
        return buildChildren(0L, childrenMap);
    }

    private List<PermissionNodeRecord> buildChildren(Long parentId, Map<Long, List<OperatorPermissionEntity>> childrenMap) {
        List<PermissionNodeRecord> records = new ArrayList<>();
        for (OperatorPermissionEntity entity : childrenMap.getOrDefault(parentId, List.of())) {
            records.add(new PermissionNodeRecord(
                    entity.getPermissionKey(),
                    entity.getTitle(),
                    buildChildren(entity.getId(), childrenMap)));
        }
        return records;
    }

    private OperatorEmployeeRecord toEmployeeRecord(
            OperatorEmployeeEntity employeeEntity,
            OperatorAccountEntity accountEntity,
            Collection<Long> roleIds) {
        return new OperatorEmployeeRecord(
                String.valueOf(employeeEntity.getId()),
                accountEntity.getAccount(),
                Boolean.TRUE.equals(accountEntity.getEnabled()),
                employeeEntity.getName(),
                employeeEntity.getEmployeeNo(),
                employeeEntity.getPhone(),
                employeeEntity.getEmail(),
                String.valueOf(employeeEntity.getDepartmentId()),
                employeeEntity.getPosition(),
                roleIds.stream().map(String::valueOf).toList(),
                employeeEntity.getStatus(),
                employeeEntity.getJoinDate().toString(),
                employeeEntity.getAddress(),
                employeeEntity.getBio(),
                employeeEntity.getEmergencyContact(),
                employeeEntity.getEmergencyPhone(),
                employeeEntity.getUpdatedAt().toString());
    }

    private OperatorDepartmentRecord toDepartmentRecord(OperatorDepartmentEntity entity) {
        return new OperatorDepartmentRecord(
                String.valueOf(entity.getId()),
                entity.getParentId() == null ? null : String.valueOf(entity.getParentId()),
                entity.getName(),
                entity.getCode(),
                entity.getManagerEmployeeId() == null ? null : String.valueOf(entity.getManagerEmployeeId()),
                entity.getDescription(),
                entity.getSortOrder());
    }

    private OperatorEmployeeEntity getRequiredEmployee(Long employeeId) {
        OperatorEmployeeEntity entity = operatorEmployeeMapper.selectById(employeeId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("员工不存在");
        }
        return entity;
    }

    private OperatorAccountEntity getRequiredAccountByEmployeeId(Long employeeId) {
        OperatorAccountEntity entity = operatorAccountMapper.selectOne(new LambdaQueryWrapper<OperatorAccountEntity>()
                .eq(OperatorAccountEntity::getEmployeeId, employeeId)
                .eq(OperatorAccountEntity::getDeleted, false)
                .last("LIMIT 1"));
        if (entity == null) {
            throw new BusinessException("员工账号不存在");
        }
        return entity;
    }

    private OperatorRoleEntity getRequiredRole(Long roleId) {
        OperatorRoleEntity entity = operatorRoleMapper.selectById(roleId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("角色不存在");
        }
        return entity;
    }

    private OperatorDepartmentEntity getRequiredDepartment(Long departmentId) {
        OperatorDepartmentEntity entity = operatorDepartmentMapper.selectById(departmentId);
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            throw new BusinessException("部门不存在");
        }
        return entity;
    }

    private List<OperatorDepartmentEntity> listDepartments() {
        return operatorDepartmentMapper.selectList(new LambdaQueryWrapper<OperatorDepartmentEntity>()
                .eq(OperatorDepartmentEntity::getDeleted, false));
    }

    private List<OperatorPermissionEntity> listPermissions() {
        return operatorPermissionMapper.selectList(new LambdaQueryWrapper<OperatorPermissionEntity>()
                .eq(OperatorPermissionEntity::getDeleted, false));
    }

    private List<OperatorRoleEntity> listRoles() {
        return operatorRoleMapper.selectList(new LambdaQueryWrapper<OperatorRoleEntity>()
                .eq(OperatorRoleEntity::getDeleted, false));
    }

    private List<OperatorEmployeeEntity> listEmployees() {
        return operatorEmployeeMapper.selectList(new LambdaQueryWrapper<OperatorEmployeeEntity>()
                .eq(OperatorEmployeeEntity::getDeleted, false));
    }

    private List<OperatorAccountEntity> listAccounts() {
        return operatorAccountMapper.selectList(new LambdaQueryWrapper<OperatorAccountEntity>()
                .eq(OperatorAccountEntity::getDeleted, false));
    }

    private List<OperatorEmployeeRoleEntity> listEmployeeRoles() {
        return operatorEmployeeRoleMapper.selectList(new LambdaQueryWrapper<>());
    }

    private List<OperatorRolePermissionEntity> listRolePermissions() {
        return operatorRolePermissionMapper.selectList(new LambdaQueryWrapper<>());
    }

    private Long parseLong(String value) {
        return Long.parseLong(value);
    }

    private Long parseNullableLong(String value) {
        return value == null || value.isBlank() ? null : Long.parseLong(value);
    }

    private List<Long> parseLongIds(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream().map(Long::parseLong).toList();
    }

    public record OperatorEnterpriseBootstrapPayload(
            OperatorEmployeeRecord currentEmployee,
            List<OperatorEmployeeRecord> employees,
            List<OperatorRoleRecord> roles,
            List<PermissionNodeRecord> permissions,
            List<OperatorDepartmentRecord> organizations) {
    }

    public record OperatorEmployeeRecord(
            String id,
            String account,
            boolean accountEnabled,
            String name,
            String employeeNo,
            String phone,
            String email,
            String departmentId,
            String position,
            List<String> roleIds,
            String status,
            String joinDate,
            String address,
            String bio,
            String emergencyContact,
            String emergencyPhone,
            String updatedAt) {
    }

    public record OperatorRoleRecord(
            String id,
            String name,
            String code,
            String description,
            List<String> permissionKeys,
            boolean isBuiltIn) {
    }

    public record PermissionNodeRecord(String key, String title, List<PermissionNodeRecord> children) {
    }

    public record OperatorDepartmentRecord(
            String id,
            String parentId,
            String name,
            String code,
            String managerEmployeeId,
            String description,
            Integer sortOrder) {
    }

    public record OperatorEmployeeUpsertRequest(
            String account,
            String password,
            boolean accountEnabled,
            String name,
            String employeeNo,
            String phone,
            String email,
            String departmentId,
            String position,
            List<String> roleIds,
            String status,
            java.time.LocalDate joinDate,
            String address,
            String bio,
            String emergencyContact,
            String emergencyPhone) {
    }

    public record OperatorEmployeeProfileUpdateRequest(
            String name,
            String phone,
            String email,
            String position,
            String address,
            String bio,
            String emergencyContact,
            String emergencyPhone) {
    }

    public record OperatorRoleUpsertRequest(
            String name,
            String code,
            String description,
            List<String> permissionKeys) {
    }

    public record OperatorRolePermissionUpdateRequest(List<String> permissionKeys) {
    }

    public record OperatorDepartmentUpsertRequest(
            String parentId,
            String name,
            String code,
            String managerEmployeeId,
            String description,
            Integer sortOrder) {
    }
}
