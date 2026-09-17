package com.saimeng.auth;

import com.saimeng.common.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 当前登录用户工具类。
 */
public final class CurrentUserContext {

    private CurrentUserContext() {
    }

    /**
     * 获取当前登录用户。
     *
     * @return 当前用户
     */
    public static CurrentUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CurrentUser currentUser)) {
            throw new BusinessException("当前未登录");
        }
        return currentUser;
    }
}
