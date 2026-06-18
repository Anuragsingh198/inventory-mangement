from app.models.enums import UserRole

# Permission wildcards: "resource.action" or "resource.*" or "*"
ROLE_PERMISSIONS: dict[UserRole, set[str]] = {
    UserRole.SUPER_ADMIN: {"*"},
    UserRole.ADMIN: {"*"},
    UserRole.INVENTORY_MANAGER: {
        "products.*",
        "categories.*",
        "inventory.*",
        "warehouses.*",
        "suppliers.*",
        "purchases.*",
        "batches.*",
        "audits.*",
        "reports.read",
        "alerts.*",
        "import.*",
        "export.*",
        "ai.read",
    },
    UserRole.WAREHOUSE_STAFF: {
        "inventory.read",
        "inventory.adjust",
        "warehouses.read",
        "stock_movements.read",
        "purchases.receive",
        "sales.fulfill",
        "transfers.*",
        "audits.*",
        "batches.read",
        "alerts.read",
    },
    UserRole.SALES_EXECUTIVE: {
        "products.read",
        "inventory.read",
        "customers.*",
        "sales.*",
        "reports.read",
        "alerts.read",
        "ai.read",
    },
    UserRole.ACCOUNTANT: {
        "products.read",
        "inventory.read",
        "suppliers.read",
        "purchases.read",
        "sales.read",
        "invoices.*",
        "reports.*",
        "export.*",
        "alerts.read",
    },
    UserRole.VIEWER: {
        "products.read",
        "categories.read",
        "inventory.read",
        "warehouses.read",
        "suppliers.read",
        "purchases.read",
        "sales.read",
        "reports.read",
        "alerts.read",
        "ai.read",
    },
}


def normalize_role(role: UserRole) -> UserRole:
    if role == UserRole.ADMIN:
        return UserRole.SUPER_ADMIN
    return role


def has_permission(role: UserRole, permission: str) -> bool:
    role = normalize_role(role)
    perms = ROLE_PERMISSIONS.get(role, set())
    if "*" in perms:
        return True
    if permission in perms:
        return True
    resource = permission.split(".")[0]
    return f"{resource}.*" in perms


def is_admin_role(role: UserRole) -> bool:
    return normalize_role(role) == UserRole.SUPER_ADMIN
