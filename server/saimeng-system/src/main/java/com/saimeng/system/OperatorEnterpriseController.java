package com.saimeng.system;

import com.saimeng.auth.CurrentUserContext;
import com.saimeng.common.ApiResponse;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 运营后台企业中心接口。
 */
@RestController
@RequestMapping("/api/admin/operator-enterprise")
public class OperatorEnterpriseController {

    private final OperatorEnterpriseService operatorEnterpriseService;

    public OperatorEnterpriseController(OperatorEnterpriseService operatorEnterpriseService) {
        this.operatorEnterpriseService = operatorEnterpriseService;
    }

    /**
     * 获取企业中心初始化数据。
     *
     * @return 初始化数据
     */
    @GetMapping("/bootstrap")
    public ApiResponse<OperatorEnterpriseService.OperatorEnterpriseBootstrapPayload> getBootstrap() {
        return ApiResponse.success(operatorEnterpriseService.getBootstrap(CurrentUserContext.getCurrentUser().userId()));
    }

    /**
     * 获取当前员工档案。
     *
     * @return 当前员工
     */
    @GetMapping("/me")
    public ApiResponse<OperatorEnterpriseService.OperatorEmployeeRecord> getCurrentEmployee() {
        return ApiResponse.success(operatorEnterpriseService.getCurrentEmployee(CurrentUserContext.getCurrentUser().userId()));
    }

    /**
     * 更新当前员工档案。
     *
     * @param request 请求
     * @return 最新员工档案
     */
    @PutMapping("/me/profile")
    public ApiResponse<OperatorEnterpriseService.OperatorEmployeeRecord> updateOwnProfile(
            @RequestBody OperatorEnterpriseService.OperatorEmployeeProfileUpdateRequest request) {
        return ApiResponse.success(operatorEnterpriseService.updateOwnProfile(
                CurrentUserContext.getCurrentUser().userId(),
                request));
    }

    /**
     * 创建员工。
     *
     * @param request 请求
     * @return 员工记录
     */
    @PostMapping("/employees")
    public ApiResponse<OperatorEnterpriseService.OperatorEmployeeRecord> createEmployee(
            @RequestBody OperatorEnterpriseService.OperatorEmployeeUpsertRequest request) {
        return ApiResponse.success(operatorEnterpriseService.createEmployee(request));
    }

    /**
     * 更新员工。
     *
     * @param employeeId 员工 ID
     * @param request 请求
     * @return 员工记录
     */
    @PutMapping("/employees/{employeeId}")
    public ApiResponse<OperatorEnterpriseService.OperatorEmployeeRecord> updateEmployee(
            @PathVariable Long employeeId,
            @RequestBody OperatorEnterpriseService.OperatorEmployeeUpsertRequest request) {
        return ApiResponse.success(operatorEnterpriseService.updateEmployee(employeeId, request));
    }

    /**
     * 删除员工。
     *
     * @param employeeId 员工 ID
     * @return 空响应
     */
    @DeleteMapping("/employees/{employeeId}")
    public ApiResponse<Void> deleteEmployee(@PathVariable Long employeeId) {
        operatorEnterpriseService.deleteEmployee(employeeId);
        return ApiResponse.success(null);
    }

    /**
     * 创建角色。
     *
     * @param request 请求
     * @return 角色记录
     */
    @PostMapping("/roles")
    public ApiResponse<OperatorEnterpriseService.OperatorRoleRecord> createRole(
            @RequestBody OperatorEnterpriseService.OperatorRoleUpsertRequest request) {
        return ApiResponse.success(operatorEnterpriseService.createRole(request));
    }

    /**
     * 更新角色。
     *
     * @param roleId 角色 ID
     * @param request 请求
     * @return 角色记录
     */
    @PutMapping("/roles/{roleId}")
    public ApiResponse<OperatorEnterpriseService.OperatorRoleRecord> updateRole(
            @PathVariable Long roleId,
            @RequestBody OperatorEnterpriseService.OperatorRoleUpsertRequest request) {
        return ApiResponse.success(operatorEnterpriseService.updateRole(roleId, request));
    }

    /**
     * 删除角色。
     *
     * @param roleId 角色 ID
     * @return 空响应
     */
    @DeleteMapping("/roles/{roleId}")
    public ApiResponse<Void> deleteRole(@PathVariable Long roleId) {
        operatorEnterpriseService.deleteRole(roleId);
        return ApiResponse.success(null);
    }

    /**
     * 更新角色权限。
     *
     * @param roleId 角色 ID
     * @param request 请求
     * @return 空响应
     */
    @PutMapping("/roles/{roleId}/permissions")
    public ApiResponse<Void> updateRolePermissions(
            @PathVariable Long roleId,
            @RequestBody OperatorEnterpriseService.OperatorRolePermissionUpdateRequest request) {
        operatorEnterpriseService.updateRolePermissions(roleId, request);
        return ApiResponse.success(null);
    }

    /**
     * 创建部门。
     *
     * @param request 请求
     * @return 部门记录
     */
    @PostMapping("/departments")
    public ApiResponse<OperatorEnterpriseService.OperatorDepartmentRecord> createDepartment(
            @RequestBody OperatorEnterpriseService.OperatorDepartmentUpsertRequest request) {
        return ApiResponse.success(operatorEnterpriseService.createDepartment(request));
    }

    /**
     * 更新部门。
     *
     * @param departmentId 部门 ID
     * @param request 请求
     * @return 部门记录
     */
    @PutMapping("/departments/{departmentId}")
    public ApiResponse<OperatorEnterpriseService.OperatorDepartmentRecord> updateDepartment(
            @PathVariable Long departmentId,
            @RequestBody OperatorEnterpriseService.OperatorDepartmentUpsertRequest request) {
        return ApiResponse.success(operatorEnterpriseService.updateDepartment(departmentId, request));
    }

    /**
     * 删除部门。
     *
     * @param departmentId 部门 ID
     * @return 空响应
     */
    @DeleteMapping("/departments/{departmentId}")
    public ApiResponse<Void> deleteDepartment(@PathVariable Long departmentId) {
        operatorEnterpriseService.deleteDepartment(departmentId);
        return ApiResponse.success(null);
    }
}
