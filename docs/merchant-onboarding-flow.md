# 分销商入驻与商品入库主链路设计

## 1. 目标

这一条主链路同时打通四件事：

1. 用户实名认证成为客户。
2. 客户申请成为分销商并通过审核。
3. 分销商从公海库选品进入自己的分销库。
4. 分销商上传自有商品，审核通过后进入公海库。

## 2. 身份流转

### 第一步：注册账号

- 创建统一账号 `sys_user`
- 初始不授予分销权限

### 第二步：实名认证

- 提交实名资料
- 审核通过后，具备客户购买权限

### 第三步：申请分销商入驻

- 填写店铺资料、资质、结算信息
- 运营后台审核通过
- 为账号新增分销角色

## 3. 商品流转

### 场景 A：平台运营上传商品

1. 运营后台创建商品
2. 商品审核通过
3. 商品进入公海库
4. 分销商可选品加入自己的分销库
5. 系统生成分销链接

### 场景 B：分销商上传自有商品

1. 分销商后台提交商品
2. 运营后台审核商品
3. 审核通过后进入公海库
4. 该分销商自动拥有分销关系
5. 其他分销商也可继续选品分销

## 4. 后端首批接口建议

### 认证与会员

- `POST /api/auth/register`
- `POST /api/member/real-name-auth`
- `GET /api/member/profile`

### 分销商

- `POST /api/merchant/applications`
- `GET /api/merchant/applications/current`
- `POST /api/admin/merchant-applications/{id}/approve`
- `POST /api/admin/merchant-applications/{id}/reject`

### 公海商品

- `GET /api/products/public-pool`
- `POST /api/merchant/products/select`
- `POST /api/merchant/products`
- `GET /api/merchant/products`

### 商品审核

- `POST /api/admin/products/{id}/approve`
- `POST /api/admin/products/{id}/reject`

## 5. 首批页面建议

### WEB 端

- 注册页
- 实名认证页
- 个人中心角色状态页

### 分销商后台

- 入驻申请页
- 公海选品页
- 自有商品提报页
- 我的分销商品页

### 运营后台

- 实名认证审核页
- 分销商审核页
- 商品审核页
- 公海库管理页

## 6. 数据落地原则

1. 用户身份与分销商身份分离建模。
2. 商品主档与分销关系分离建模。
3. 审核动作必须保留审核记录。
4. 角色变更必须落库，不靠前端临时判断。
