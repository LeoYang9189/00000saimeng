CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY,
    phone VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    enterprise_id BIGINT,
    enabled BOOLEAN NOT NULL,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS enterprise_id BIGINT;
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS sys_user_role (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_code VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_sys_user_role UNIQUE (user_id, role_code)
);

CREATE TABLE IF NOT EXISTS member_real_name_auth (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    real_name VARCHAR(64) NOT NULL,
    id_card_no VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    review_remark VARCHAR(255),
    submitted_at TIMESTAMP NOT NULL,
    reviewed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_feedback (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    feedback_type VARCHAR(32) NOT NULL,
    related_order_no VARCHAR(64),
    content VARCHAR(800) NOT NULL,
    contact VARCHAR(128),
    attachment_names_json CLOB,
    status VARCHAR(32) NOT NULL,
    source_channel VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS merchant_application (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    store_name VARCHAR(128) NOT NULL,
    company_name VARCHAR(128) NOT NULL,
    contact_name VARCHAR(64) NOT NULL,
    contact_phone VARCHAR(64),
    business_scope VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    review_remark VARCHAR(255),
    extra_payload_json CLOB,
    submitted_at TIMESTAMP NOT NULL,
    reviewed_at TIMESTAMP
);

ALTER TABLE merchant_application ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(64);
ALTER TABLE merchant_application ADD COLUMN IF NOT EXISTS extra_payload_json CLOB;

CREATE TABLE IF NOT EXISTS product_spu (
    id BIGINT PRIMARY KEY,
    product_name VARCHAR(128) NOT NULL,
    product_code VARCHAR(64),
    category_id BIGINT,
    brand_name VARCHAR(128),
    origin_country VARCHAR(64) NOT NULL,
    selling_point VARCHAR(255) NOT NULL,
    main_image CLOB,
    thumbnail_image CLOB,
    box_image CLOB,
    gallery_images CLOB,
    barcode VARCHAR(255),
    net_content VARCHAR(64),
    case_spec VARCHAR(64),
    pallets_per_container INT,
    cases_per_pallet INT,
    cases_per_container INT,
    shelf_life_months INT,
    size_cm VARCHAR(64),
    gross_weight_kg VARCHAR(64),
    ingredients VARCHAR(1000),
    stock_quantity INT,
    member_price_bronze DECIMAL(12, 2),
    member_price_silver DECIMAL(12, 2),
    member_price_gold DECIMAL(12, 2),
    member_price_platinum DECIMAL(12, 2),
    member_price_diamond DECIMAL(12, 2),
    member_price_black_diamond DECIMAL(12, 2),
    retail_price DECIMAL(12, 2),
    detail_html CLOB,
    source_type VARCHAR(32) NOT NULL,
    source_merchant_user_id BIGINT,
    audit_status VARCHAR(32) NOT NULL,
    in_public_pool BOOLEAN NOT NULL,
    enabled BOOLEAN NOT NULL,
    deleted BOOLEAN NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    reviewed_by_user_id BIGINT,
    reviewed_at TIMESTAMP
);

ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS product_code VARCHAR(64);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS category_id BIGINT;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS brand_name VARCHAR(128);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS main_image CLOB;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS thumbnail_image CLOB;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS box_image CLOB;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS gallery_images CLOB;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS net_content VARCHAR(64);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS case_spec VARCHAR(64);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS pallets_per_container INT;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS cases_per_pallet INT;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS cases_per_container INT;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS shelf_life_months INT;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS size_cm VARCHAR(64);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS gross_weight_kg VARCHAR(64);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS ingredients VARCHAR(1000);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS stock_quantity INT;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS member_price_bronze DECIMAL(12, 2);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS member_price_silver DECIMAL(12, 2);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS member_price_gold DECIMAL(12, 2);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS member_price_platinum DECIMAL(12, 2);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS member_price_diamond DECIMAL(12, 2);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS member_price_black_diamond DECIMAL(12, 2);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS retail_price DECIMAL(12, 2);
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS detail_html CLOB;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE product_spu ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS product_category (
    id BIGINT PRIMARY KEY,
    parent_id BIGINT,
    category_name VARCHAR(128) NOT NULL,
    category_code VARCHAR(64) NOT NULL,
    category_level INT NOT NULL,
    sort_order INT NOT NULL,
    enabled BOOLEAN NOT NULL,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS quotation_sheet (
    id BIGINT PRIMARY KEY,
    quotation_no VARCHAR(64) NOT NULL UNIQUE,
    quotation_title VARCHAR(255) NOT NULL,
    customer_company VARCHAR(255) NOT NULL,
    customer_name VARCHAR(128) NOT NULL,
    contact_name VARCHAR(128) NOT NULL,
    contact_phone VARCHAR(64) NOT NULL,
    remark VARCHAR(1000),
    total_product_count INT NOT NULL,
    total_quantity INT NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    last_exported_at TIMESTAMP,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS quotation_item (
    id BIGINT PRIMARY KEY,
    quotation_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    sort_order INT NOT NULL,
    snapshot_json CLOB NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS merchant_product_relation (
    id BIGINT PRIMARY KEY,
    merchant_user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    select_source VARCHAR(32) NOT NULL,
    distribution_link VARCHAR(255) NOT NULL,
    selected_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_merchant_product UNIQUE (merchant_user_id, product_id)
);

CREATE TABLE IF NOT EXISTS ai_gateway_settings (
    id BIGINT PRIMARY KEY,
    gateway_base_url VARCHAR(255) NOT NULL,
    gateway_api_key VARCHAR(255),
    request_timeout_ms INT NOT NULL,
    max_retry_count INT NOT NULL,
    default_provider_id VARCHAR(64) NOT NULL,
    default_chat_model_id VARCHAR(64) NOT NULL,
    default_reasoning_model_id VARCHAR(64) NOT NULL,
    default_embedding_model_id VARCHAR(64) NOT NULL,
    default_image_model_id VARCHAR(64) NOT NULL,
    route_strategy VARCHAR(32) NOT NULL,
    enable_fallback BOOLEAN NOT NULL,
    enable_audit_log BOOLEAN NOT NULL,
    mask_api_key_in_log BOOLEAN NOT NULL,
    default_daily_token_limit BIGINT NOT NULL,
    default_monthly_budget_limit INT NOT NULL,
    default_requests_per_minute INT NOT NULL,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_provider (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    provider_type VARCHAR(64) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(255),
    organization_id VARCHAR(128),
    enabled BOOLEAN NOT NULL,
    priority INT NOT NULL,
    monthly_budget_limit INT NOT NULL,
    requests_per_minute INT NOT NULL,
    default_model_id VARCHAR(64) NOT NULL,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_model (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    model_key VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,
    context_window INT NOT NULL,
    max_output_tokens INT NOT NULL,
    input_price_per_million DECIMAL(10, 2) NOT NULL,
    output_price_per_million DECIMAL(10, 2) NOT NULL,
    enabled BOOLEAN NOT NULL,
    remark VARCHAR(500),
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_department (
    id BIGINT PRIMARY KEY,
    parent_id BIGINT,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(64) NOT NULL UNIQUE,
    manager_employee_id BIGINT,
    description VARCHAR(500),
    sort_order INT NOT NULL,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_employee (
    id BIGINT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    employee_no VARCHAR(64) NOT NULL UNIQUE,
    phone VARCHAR(64) NOT NULL,
    email VARCHAR(128) NOT NULL,
    department_id BIGINT NOT NULL,
    position VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    join_date DATE NOT NULL,
    address VARCHAR(255),
    bio VARCHAR(500),
    emergency_contact VARCHAR(64),
    emergency_phone VARCHAR(64),
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_account (
    id BIGINT PRIMARY KEY,
    employee_id BIGINT NOT NULL UNIQUE,
    account VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    enabled BOOLEAN NOT NULL,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operator_role (
    id BIGINT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(500),
    is_built_in BOOLEAN NOT NULL,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_permission (
    id BIGINT PRIMARY KEY,
    parent_id BIGINT,
    title VARCHAR(128) NOT NULL,
    permission_key VARCHAR(128) NOT NULL UNIQUE,
    permission_type VARCHAR(32) NOT NULL,
    route_path VARCHAR(255),
    sort_order INT NOT NULL,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_role_permission (
    id BIGINT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_operator_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS operator_employee_role (
    id BIGINT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_operator_employee_role UNIQUE (employee_id, role_id)
);

CREATE TABLE IF NOT EXISTS distributor_enterprise (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    application_id BIGINT UNIQUE,
    enterprise_no VARCHAR(64),
    source_type VARCHAR(32) NOT NULL,
    company_name VARCHAR(128) NOT NULL,
    store_name VARCHAR(128) NOT NULL,
    contact_name VARCHAR(64) NOT NULL,
    contact_phone VARCHAR(64),
    business_scope VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL,
    review_remark VARCHAR(255),
    member_level_key VARCHAR(64),
    profile_snapshot_json CLOB,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

ALTER TABLE distributor_enterprise ADD COLUMN IF NOT EXISTS member_level_key VARCHAR(64);
ALTER TABLE distributor_enterprise ADD COLUMN IF NOT EXISTS enterprise_no VARCHAR(64);
ALTER TABLE distributor_enterprise ADD COLUMN IF NOT EXISTS profile_snapshot_json CLOB;

CREATE TABLE IF NOT EXISTS enterprise_join_request (
    id BIGINT PRIMARY KEY,
    enterprise_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    applicant_name VARCHAR(128) NOT NULL,
    applicant_phone VARCHAR(64) NOT NULL,
    position VARCHAR(128),
    apply_remark VARCHAR(500),
    status VARCHAR(32) NOT NULL,
    review_remark VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    reviewed_at TIMESTAMP,
    CONSTRAINT uk_enterprise_join_request UNIQUE (enterprise_id, user_id)
);

CREATE TABLE IF NOT EXISTS member_level_config (
    id BIGINT PRIMARY KEY,
    level_key VARCHAR(64) NOT NULL UNIQUE,
    level_name VARCHAR(64) NOT NULL,
    level_rank INT NOT NULL,
    level_title VARCHAR(128) NOT NULL,
    level_description VARCHAR(500) NOT NULL,
    summary_text VARCHAR(255) NOT NULL,
    progress_text VARCHAR(255) NOT NULL,
    mission_text VARCHAR(255) NOT NULL,
    mission_action VARCHAR(64) NOT NULL,
    highlight_title VARCHAR(128) NOT NULL,
    visual_src VARCHAR(255) NOT NULL,
    hero_start VARCHAR(32) NOT NULL,
    hero_mid VARCHAR(32) NOT NULL,
    hero_end VARCHAR(32) NOT NULL,
    accent VARCHAR(32) NOT NULL,
    soft_accent VARCHAR(64) NOT NULL,
    card_surface VARCHAR(64) NOT NULL,
    placeholder_tone VARCHAR(64) NOT NULL,
    glow_color VARCHAR(64) NOT NULL,
    spark_color VARCHAR(64) NOT NULL,
    progress_percent INT NOT NULL,
    highlight_keys VARCHAR(255) NOT NULL,
    benefit_keys VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS merchant_application_ai_report (
    id BIGINT PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE,
    risk_level VARCHAR(32) NOT NULL,
    recommendation VARCHAR(32) NOT NULL,
    analysis_summary VARCHAR(1000) NOT NULL,
    missing_document_keys VARCHAR(255) NOT NULL,
    risk_flags VARCHAR(500) NOT NULL,
    authenticity_score INT NOT NULL,
    completeness_score INT NOT NULL,
    compliance_score INT NOT NULL,
    report_status VARCHAR(32) NOT NULL,
    analyzed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS merchant_application_document (
    id BIGINT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    document_key VARCHAR(64) NOT NULL,
    document_name VARCHAR(128) NOT NULL,
    document_no VARCHAR(128),
    authenticity_status VARCHAR(32) NOT NULL,
    expiry_date DATE,
    expiry_status VARCHAR(32) NOT NULL,
    document_status VARCHAR(32) NOT NULL,
    risk_note VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_merchant_application_document UNIQUE (application_id, document_key)
);

CREATE TABLE IF NOT EXISTS customer_portrait_snapshot (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    enterprise_id BIGINT,
    segment_code VARCHAR(32) NOT NULL,
    segment_name VARCHAR(64) NOT NULL,
    primary_categories VARCHAR(255) NOT NULL,
    pickup_frequency_per_month DECIMAL(10, 2) NOT NULL,
    avg_order_amount DECIMAL(12, 2) NOT NULL,
    repayment_days INT,
    recommended_policy VARCHAR(500) NOT NULL,
    policy_tags VARCHAR(255) NOT NULL,
    external_data_status VARCHAR(32) NOT NULL,
    external_data_endpoint VARCHAR(255) NOT NULL,
    last_synced_at TIMESTAMP,
    deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
