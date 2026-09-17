package com.saimeng.system;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.saimeng.common.BusinessException;
import com.saimeng.system.entity.SysUserEntity;
import com.saimeng.system.entity.SysUserRoleEntity;
import com.saimeng.system.mapper.SysUserMapper;
import com.saimeng.system.mapper.SysUserRoleMapper;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户账号服务。
 */
@Service
public class UserAccountService {

    private final SysUserMapper sysUserMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final VerificationCodeService verificationCodeService;

    public UserAccountService(
            SysUserMapper sysUserMapper,
            SysUserRoleMapper sysUserRoleMapper,
            VerificationCodeService verificationCodeService) {
        this.sysUserMapper = sysUserMapper;
        this.sysUserRoleMapper = sysUserRoleMapper;
        this.verificationCodeService = verificationCodeService;
    }

    /**
     * 注册普通账号。
     *
     * @param phone 手机号
     * @param verificationCode 验证码
     * @return 用户概要
     */
    @Transactional
    public UserProfile register(String phone, String verificationCode) {
        if (findByPhone(phone) != null) {
            throw new BusinessException("该账号已注册");
        }
        verificationCodeService.verifyCode(phone, verificationCode);
        SysUserEntity entity = new SysUserEntity();
        entity.setId(IdWorker.getId());
        entity.setPhone(phone);
        entity.setPassword("");
        entity.setDisplayName(buildDefaultDisplayName(phone));
        entity.setEnabled(true);
        entity.setDeleted(false);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        sysUserMapper.insert(entity);
        return toProfile(entity);
    }

    /**
     * 登录账号。
     *
     * @param phone 手机号
     * @param password 密码
     * @return 用户概要
     */
    public UserProfile login(String phone, String password) {
        SysUserEntity entity = getRequiredByPhone(phone);
        if (!Boolean.TRUE.equals(entity.getEnabled())) {
            throw new BusinessException("当前账号已被禁用");
        }
        if (!entity.getPassword().equals(password)) {
            throw new BusinessException("账号或密码错误");
        }
        return toProfile(entity);
    }

    /**
     * 使用验证码登录。
     *
     * @param phone 手机号
     * @param verificationCode 验证码
     * @return 用户概要
     */
    public UserProfile loginWithVerificationCode(String phone, String verificationCode) {
        verificationCodeService.verifyCode(phone, verificationCode);
        return toProfile(getRequiredByPhone(phone));
    }

    /**
     * 运营员工登录。
     *
     * @param account 账号
     * @param password 密码
     * @return 用户概要
     */
    public UserProfile loginOperator(String account, String password) {
        UserProfile profile = login(account, password);
        if (!hasAnyRole(profile.userId(), Set.of(RoleCodes.OPERATOR_ADMIN, RoleCodes.OPERATOR_STAFF))) {
            throw new BusinessException("当前账号无运营后台权限");
        }
        return profile;
    }

    /**
     * 发送短信验证码。
     *
     * @param phone 手机号
     * @return 验证码有效秒数
     */
    public long sendVerificationCode(String phone) {
        return verificationCodeService.sendCode(phone);
    }

    /**
     * 获取用户概要。
     *
     * @param userId 用户 ID
     * @return 用户概要
     */
    public UserProfile getProfile(Long userId) {
        return toProfile(getRequiredById(userId));
    }

    /**
     * 追加用户角色。
     *
     * @param userId 用户 ID
     * @param roleCode 角色编码
     * @return 用户概要
     */
    @Transactional
    public UserProfile addRole(Long userId, String roleCode) {
        boolean exists = sysUserRoleMapper.selectCount(new LambdaQueryWrapper<SysUserRoleEntity>()
                .eq(SysUserRoleEntity::getUserId, userId)
                .eq(SysUserRoleEntity::getRoleCode, roleCode)) > 0;
        if (!exists) {
            SysUserRoleEntity entity = new SysUserRoleEntity();
            entity.setId(IdWorker.getId());
            entity.setUserId(userId);
            entity.setRoleCode(roleCode);
            entity.setCreatedAt(LocalDateTime.now());
            sysUserRoleMapper.insert(entity);
        }
        return getProfile(userId);
    }

    /**
     * 移除用户角色。
     *
     * @param userId 用户 ID
     * @param roleCode 角色编码
     * @return 用户概要
     */
    @Transactional
    public UserProfile removeRole(Long userId, String roleCode) {
        sysUserRoleMapper.delete(new LambdaQueryWrapper<SysUserRoleEntity>()
                .eq(SysUserRoleEntity::getUserId, userId)
                .eq(SysUserRoleEntity::getRoleCode, roleCode));
        return getProfile(userId);
    }

    /**
     * 判断是否拥有角色。
     *
     * @param userId 用户 ID
     * @param roleCode 角色编码
     * @return 是否拥有
     */
    public boolean hasRole(Long userId, String roleCode) {
        return sysUserRoleMapper.selectCount(new LambdaQueryWrapper<SysUserRoleEntity>()
                .eq(SysUserRoleEntity::getUserId, userId)
                .eq(SysUserRoleEntity::getRoleCode, roleCode)) > 0;
    }

    /**
     * 判断是否拥有任一角色。
     *
     * @param userId 用户 ID
     * @param roleCodes 角色编码集合
     * @return 是否拥有任一角色
     */
    public boolean hasAnyRole(Long userId, Set<String> roleCodes) {
        return sysUserRoleMapper.selectCount(new LambdaQueryWrapper<SysUserRoleEntity>()
                .eq(SysUserRoleEntity::getUserId, userId)
                .in(SysUserRoleEntity::getRoleCode, roleCodes)) > 0;
    }

    private SysUserEntity getRequiredByPhone(String phone) {
        SysUserEntity entity = findByPhone(phone);
        if (entity == null) {
            throw new BusinessException("账号不存在");
        }
        return entity;
    }

    private SysUserEntity findByPhone(String phone) {
        return sysUserMapper.selectOne(new LambdaQueryWrapper<SysUserEntity>()
                .eq(SysUserEntity::getPhone, phone)
                .eq(SysUserEntity::getDeleted, false)
                .last("limit 1"));
    }

    private SysUserEntity getRequiredById(Long userId) {
        SysUserEntity entity = sysUserMapper.selectById(userId);
        if (entity == null) {
            throw new BusinessException("用户不存在");
        }
        return entity;
    }

    private String buildDefaultDisplayName(String phone) {
        String suffix = phone.length() > 4 ? phone.substring(phone.length() - 4) : phone;
        return "赛盟用户" + suffix;
    }

    private UserProfile toProfile(SysUserEntity entity) {
        List<SysUserRoleEntity> roleEntities = sysUserRoleMapper.selectList(new LambdaQueryWrapper<SysUserRoleEntity>()
                .eq(SysUserRoleEntity::getUserId, entity.getId()));
        Set<String> roles = new LinkedHashSet<>();
        roleEntities.forEach(role -> roles.add(role.getRoleCode()));
        return new UserProfile(entity.getId(), entity.getPhone(), entity.getDisplayName(), roles, entity.getCreatedAt());
    }
}
