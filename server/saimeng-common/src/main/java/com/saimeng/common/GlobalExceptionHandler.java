package com.saimeng.common;

import jakarta.validation.ConstraintViolationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理业务异常。
     *
     * @param exception 业务异常
     * @return 错误响应
     */
    @ExceptionHandler(BusinessException.class)
    public ApiResponse<Void> handleBusinessException(BusinessException exception) {
        return new ApiResponse<>(4001, exception.getMessage(), null);
    }

    /**
     * 处理参数校验异常。
     *
     * @param exception 参数异常
     * @return 错误响应
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
    public ApiResponse<Void> handleValidationException(Exception exception) {
        String message = exception instanceof MethodArgumentNotValidException methodArgumentNotValidException
                ? methodArgumentNotValidException.getBindingResult().getFieldError() != null
                ? methodArgumentNotValidException.getBindingResult().getFieldError().getDefaultMessage()
                : "请求参数不合法"
                : exception.getMessage();
        return new ApiResponse<>(4000, message, null);
    }

    /**
     * 处理其他异常。
     *
     * @param exception 未知异常
     * @return 错误响应
     */
    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleException(Exception exception) {
        return new ApiResponse<>(5000, exception.getMessage(), null);
    }
}
