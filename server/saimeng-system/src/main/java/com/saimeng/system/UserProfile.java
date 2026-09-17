package com.saimeng.system;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * 用户概要信息。
 *
 * @param userId 用户 ID
 * @param phone 手机号
 * @param displayName 显示名称
 * @param roles 角色集合
 * @param createdAt 创建时间
 */
public record UserProfile(
        Long userId,
        String phone,
        String displayName,
        Set<String> roles,
        LocalDateTime createdAt) {
}
