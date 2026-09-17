package com.saimeng.auth;

import java.util.Set;

/**
 * 当前登录用户上下文。
 *
 * @param userId 用户 ID
 * @param phone 登录账号
 * @param roles 角色集合
 */
public record CurrentUser(Long userId, String phone, Set<String> roles) {

    /**
     * 判断是否拥有指定角色。
     *
     * @param role 角色编码
     * @return 是否拥有
     */
    public boolean hasRole(String role) {
        return roles.contains(role);
    }
}
