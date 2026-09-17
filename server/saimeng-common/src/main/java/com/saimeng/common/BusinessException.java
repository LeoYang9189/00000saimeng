package com.saimeng.common;

/**
 * 业务异常，用于向接口层返回可读错误信息。
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
