
import { useEffect, useMemo, useState } from "react";
import {
  Coffee,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Package,
  LayoutDashboard,
  Pencil,
  X,
  Settings,
  Tags,
  CheckCircle,
} from "lucide-react";
import "./App.css";

// API base URL — configurable via environment or window object
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  window.API_BASE_URL ||
  "http://localhost:5080/api";

const emptyProductForm = {
  name: "",
  price: "",
  categoryId: "",
  isAvailable: true,
  stockQuantity: "0",
};

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message ||
          data?.title ||
          data?.detail ||
          `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data;
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function App() {

  const [inventoryProduct, setInventoryProduct] = useState(null);
const [inventoryHistory, setInventoryHistory] = useState([]);
const [inventoryLoading, setInventoryLoading] = useState(false);
const [inventorySaving, setInventorySaving] = useState(false);
const [inventoryError, setInventoryError] = useState("");
const [inventorySuccess, setInventorySuccess] = useState("");

const [adjustmentForm, setAdjustmentForm] = useState({
  type: "in",
  quantity: "1",
  reason: "",
});

async function openInventory(product) {
  setInventoryProduct(product);
  setInventoryHistory([]);
  setInventoryError("");
  setInventorySuccess("");
  setInventoryLoading(true);

  try {
    const history = await apiRequest(
      `/products/${product.id}/stock-adjustments`
    );

    setInventoryHistory(Array.isArray(history) ? history : []);
  } catch (err) {
    setInventoryError(
      err.message || "Unable to load inventory history."
    );
  } finally {
    setInventoryLoading(false);
  }
}

async function handleInventoryAdjustment(event) {
  event.preventDefault();

  if (!inventoryProduct) return;

  const quantity = Number(adjustmentForm.quantity);
  const reason = adjustmentForm.reason.trim();

  if (!Number.isInteger(quantity) || quantity <= 0) {
    setInventoryError("Quantity must be a positive whole number.");
    return;
  }

  if (!reason) {
    setInventoryError("Please provide a reason for the adjustment.");
    return;
  }

  // Stock-in adds quantity; stock-out subtracts it.
  const quantityChange =
    adjustmentForm.type === "in" ? quantity : -quantity;

  if (
    adjustmentForm.type === "out" &&
    quantity > inventoryProduct.stockQuantity
  ) {
    setInventoryError("Stock-out quantity exceeds current stock.");
    return;
  }

  setInventorySaving(true);
  setInventoryError("");
  setInventorySuccess("");

  try {
    await apiRequest(
      `/products/${inventoryProduct.id}/stock-adjustments`,
      {
        method: "POST",
        body: JSON.stringify({
          quantityChange,
          reason,
        }),
      }
    );

    setInventorySuccess("Inventory adjustment recorded.");
    setAdjustmentForm({
      type: "in",
      quantity: "1",
      reason: "",
    });

    await loadCatalog();

    // Refresh the selected product's current stock after catalog reload.
    const refreshedProducts = await apiRequest("/products");
    const updatedProduct = refreshedProducts.find(
      (product) => product.id === inventoryProduct.id
    );

    if (updatedProduct) {
      setInventoryProduct(updatedProduct);

      const history = await apiRequest(
        `/products/${updatedProduct.id}/stock-adjustments`
      );

      setInventoryHistory(Array.isArray(history) ? history : []);
    }
  } catch (err) {
    setInventoryError(
      err.message || "Unable to record inventory adjustment."
    );
  } finally {
    setInventorySaving(false);
  }
}

  const [view, setView] = useState("pos");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adminSearch, setAdminSearch] = useState("");
  const [adminCategory, setAdminCategory] = useState("all");
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);

  const [adminTab, setAdminTab] = useState("products");
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotalPages, setSalesTotalPages] = useState(1);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  async function loadSalesHistory(page = 1) {
    setSalesLoading(true);
    setAdminError("");

    try {
      const result = await apiRequest(`/sales?page=${page}&pageSize=10`);
      setSalesHistory(result.items || []);
      setSalesTotalPages(result.totalPages || 1);
      setSalesPage(page);
    } catch (err) {
      setAdminError(err.message || "Unable to load sales history.");
    } finally {
      setSalesLoading(false);
    }
  }

  async function loadCatalog() {
    setError("");
    setAdminError("");

    try {
      const [productData, categoryData] = await Promise.all([
        apiRequest("/products"),
        apiRequest("/categories"),
      ]);

      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      setError(err.message || "Unable to load the catalog.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

 
const filteredProducts = useMemo(() => {
  const term = search.trim().toLowerCase();

  return products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(term);

    const matchesCategory =
      selectedCategory === "all" ||
      String(product.categoryId ?? "") === selectedCategory;

    // Do not hide products just because they are unavailable
    // or temporarily out of stock.
    return matchesSearch && matchesCategory;
  });
}, [products, search, selectedCategory]);


  const filteredAdminProducts = useMemo(() => {
    const term = adminSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(term);
      const matchesCategory =
        adminCategory === "all" ||
        String(product.categoryId ?? "") === adminCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, adminSearch, adminCategory]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const availableCount = products.filter(
    (product) => product.isAvailable
  ).length;

  const lowStockCount = products.filter(
    (product) => product.stockQuantity > 0 && product.stockQuantity <= 5
  ).length;

  function addToCart(product) {
    if (!product.isAvailable || product.stockQuantity <= 0) return;

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stockQuantity) return current;

        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          stockQuantity: product.stockQuantity,
        },
      ];
    });
  }

  function updateQuantity(productId, change) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== productId) return item;

          const product = products.find((p) => p.id === productId);
          const nextQuantity = item.quantity + change;

          if (nextQuantity <= 0) return null;
          if (product && nextQuantity > product.stockQuantity) return item;

          return { ...item, quantity: nextQuantity };
        })
        .filter(Boolean)
    );
  }

  function removeFromCart(productId) {
    setCart((current) => current.filter((item) => item.id !== productId));
  }

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setAdminError("");
    setAdminSuccess("");
    setProductModalOpen(true);
  }

  function openEditProduct(product) {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: String(product.price),
      categoryId: product.categoryId ? String(product.categoryId) : "",
      isAvailable: product.isAvailable,
      stockQuantity: String(product.stockQuantity),
    });
    setAdminError("");
    setAdminSuccess("");
    setProductModalOpen(true);
  }

  function closeProductModal() {
    if (savingProduct) return;
    setProductModalOpen(false);
    setEditingProduct(null);
    setProductForm(emptyProductForm);
  }

  function updateFormField(field, value) {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    setAdminError("");
    setAdminSuccess("");

    const name = productForm.name.trim();
    const price = Number(productForm.price);
    const stockQuantity = Number(productForm.stockQuantity);

    if (!name) {
      setAdminError("Product name is required.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setAdminError("Enter a valid, non-negative price.");
      return;
    }

    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      setAdminError("Stock must be a non-negative whole number.");
      return;
    }

    const payload = {
      name,
      price,
      isAvailable: productForm.isAvailable,
      categoryId: productForm.categoryId
        ? Number(productForm.categoryId)
        : null,
      stockQuantity: editingProduct
        ? editingProduct.stockQuantity
        : stockQuantity,
    };

    setSavingProduct(true);

    try {
      if (editingProduct) {
        await apiRequest(`/products/${editingProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setProductModalOpen(false);
      setEditingProduct(null);
      setProductForm(emptyProductForm);
      setAdminSuccess(
        editingProduct
          ? "Product updated successfully."
          : "Product added successfully."
      );

      await loadCatalog();
    } catch (err) {
      setAdminError(err.message || "Unable to save product.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This may fail if the product has sales or stock history. Consider marking it unavailable instead.`
    );

    if (!confirmed) return;

    setAdminError("");
    setAdminSuccess("");

    try {
      await apiRequest(`/products/${product.id}`, {
        method: "DELETE",
      });

      setCart((current) =>
        current.filter((item) => item.id !== product.id)
      );
      setAdminSuccess(`${product.name} deleted successfully.`);
      await loadCatalog();
    } catch (err) {
      setAdminError(
        `${err.message} If this product has transaction history, mark it unavailable instead.`
      );
    }
  }

  async function handleCheckout(event) {
    event.preventDefault();
    setCheckoutError("");

    const cashAmount = Number(cashReceived);

    if (!cart.length) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    if (!Number.isFinite(cashAmount) || cashAmount < subtotal) {
      setCheckoutError("Cash received must cover the total amount.");
      return;
    }

    setSubmitting(true);

    try {
      const sale = await apiRequest("/sales", {
        method: "POST",
        body: JSON.stringify({
          cashReceived: cashAmount,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      setReceipt(sale);
      setCart([]);
      setPaymentOpen(false);
      setCashReceived("");
      await loadCatalog();
    } catch (err) {
      setCheckoutError(err.message || "Checkout failed.");
      await loadCatalog();
    } finally {
      setSubmitting(false);
    }
  }

  function openPayment() {
    setCheckoutError("");
    setCashReceived("");
    setPaymentOpen(true);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => setView("pos")}
        >
          <span className="brand-icon">
            <Coffee size={23} />
          </span>
          <span>
            <strong>Bean Coffee</strong>
            <small>Point of Sale</small>
          </span>
        </button>

        <nav className="main-nav">
          <button
            type="button"
            className={`nav-link ${view === "pos" ? "active" : ""}`}
            onClick={() => setView("pos")}
          >
            <ShoppingBag size={17} />
            Cashier POS
          </button>
          <button
            type="button"
            className={`nav-link ${view === "admin" ? "active" : ""}`}
            onClick={() => setView("admin")}
          >
            <LayoutDashboard size={17} />
            Admin
          </button>
        </nav>

        <button
          type="button"
          className="icon-button refresh-button"
          title="Refresh catalog"
          onClick={loadCatalog}
        >
          <RefreshCw size={17} />
        </button>
      </header>

      {view === "pos" ? (
        <main className="pos-layout">
          <section className="catalog-section">
            <div className="page-heading">
              <div>
                <span className="eyebrow">YOUR DAILY RITUAL</span>
                <h1>Good coffee, good day.</h1>
                <p>Select your favorites and add them to the order.</p>
              </div>
            </div>

            <div className="catalog-toolbar">
              <label className="search-box">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search coffee or drinks..."
                />
              </label>
              <div className="category-filters">
                <button
                  type="button"
                  className={`category-chip ${
                    selectedCategory === "all" ? "selected" : ""
                  }`}
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`category-chip ${
                      selectedCategory === String(category.id)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedCategory(String(category.id))
                    }
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
                <button type="button" onClick={loadCatalog}>
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="empty-state">
                <RefreshCw className="spin" size={28} />
                <p>Loading your menu...</p>
              </div>
            ) : filteredProducts.length ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  
<button
  className="product-card"
  key={product.id}
  type="button"
  disabled={!product.isAvailable || product.stockQuantity <= 0}
  onClick={() => addToCart(product)}
>

                    <div className="product-art">
                      <Coffee size={35} strokeWidth={1.5} />
                      <span className="product-stock">
                        {product.stockQuantity} left
                      </span>
                    </div>
                    <div className="product-info">
                      <span className="product-category">
                        {product.categoryName || "Uncategorized"}
                      </span>
                      <h3>{product.name}</h3>
                      <div className="product-card-bottom">
                        <strong>{formatPrice(product.price)}</strong>
                        <span className="add-product">
                          <Plus size={17} />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Package size={32} />
                <h3>No products found</h3>
                <p>
                  Try another search or add products from the Admin page.
                </p>
              </div>
            )}
          </section>

          <aside className="cart-panel">
            <div className="cart-heading">
              <div>
                <span className="eyebrow">CURRENT ORDER</span>
                <h2>Order details</h2>
              </div>
              <span className="cart-count">{cartCount}</span>
            </div>

            <div className="cart-items">
              {cart.length ? (
                cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-art">
                      <Coffee size={19} />
                    </div>
                    <div className="cart-item-details">
                      <strong>{item.name}</strong>
                      <span>{formatPrice(item.price)} each</span>
                      <div className="quantity-control">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name}`}
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus size={13} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name}`}
                          disabled={item.quantity >= item.stockQuantity}
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-end">
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                      <button
                        className="remove-item"
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="cart-empty">
                  <ShoppingBag size={29} />
                  <strong>Your order is empty</strong>
                  <span>Add a drink to get started.</span>
                </div>
              )}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Items</span>
                <span>{cartCount}</span>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <button
                type="button"
                className="checkout-button"
                disabled={!cart.length}
                onClick={openPayment}
              >
                Proceed to payment
                <span>{formatPrice(subtotal)}</span>
              </button>
              <p className="cart-footer-note">Cash payment · PHP</p>
            </div>
          </aside>
        </main>
      ) : (
        <main className="admin-page">
          <div className="page-heading admin-heading">
            <div>
              <span className="eyebrow">STORE CONFIGURATION</span>
              <h1>{adminTab === "products" ? "Product management" : "Sales history"}</h1>
              <p>
                {adminTab === "products"
                  ? "Manage your menu, prices, categories, and availability."
                  : "View completed transactions and sales details."}
              </p>
            </div>
            {adminTab === "products" && (
              <button
                type="button"
                className="primary-button"
                onClick={openAddProduct}
              >
                <Plus size={18} />
                Add product
              </button>
            )}
          </div>

          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab ${adminTab === "products" ? "active" : ""}`}
              onClick={() => setAdminTab("products")}
            >
              <Package size={17} />
              Products
            </button>
            <button
              type="button"
              className={`admin-tab ${adminTab === "sales" ? "active" : ""}`}
              onClick={() => {
                setAdminTab("sales");
                loadSalesHistory(1);
              }}
            >
              <ShoppingBag size={17} />
              Sales History
            </button>
          </div>

          {adminTab === "products" ? (
            <>
              <div className="admin-stats">
                <div className="stat-card">
                  <span className="stat-icon">
                    <Package size={20} />
                  </span>
                  <div>
                    <span>Total products</span>
                    <strong>{products.length}</strong>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">
                    <CheckCircle size={20} />
                  </span>
                  <div>
                    <span>Available products</span>
                    <strong>{availableCount}</strong>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon warning">
                    <AlertCircle size={20} />
                  </span>
                  <div>
                    <span>Low stock (1–5)</span>
                    <strong>{lowStockCount}</strong>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">
                    <Tags size={20} />
                  </span>
                  <div>
                    <span>Categories</span>
                    <strong>{categories.length}</strong>
                  </div>
                </div>
              </div>

              {adminSuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={18} />
                  <span>{adminSuccess}</span>
                  <button
                    type="button"
                    onClick={() => setAdminSuccess("")}
                    aria-label="Dismiss message"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {adminError && (
                <div className="alert alert-error">
                  <AlertCircle size={18} />
                  <span>{adminError}</span>
                  <button
                    type="button"
                    onClick={() => setAdminError("")}
                    aria-label="Dismiss message"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <section className="admin-table-card">
                <div className="admin-table-toolbar">
                  <label className="search-box">
                    <Search size={18} />
                    <input
                      value={adminSearch}
                      onChange={(event) => setAdminSearch(event.target.value)}
                      placeholder="Search products..."
                    />
                  </label>

                  <select
                    value={adminCategory}
                    onChange={(event) => setAdminCategory(event.target.value)}
                    aria-label="Filter by category"
                  >
                    <option value="all">All categories</option>
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={loadCatalog}
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="empty-state">
                    <RefreshCw className="spin" size={25} />
                    <p>Loading products...</p>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdminProducts.map((product) => (
                          <tr key={product.id}>
                            <td>
                              <div className="table-product">
                                <span className="table-product-icon">
                                  <Coffee size={19} />
                                </span>
                                <span>
                                  <strong>{product.name}</strong>
                                  <small>Product #{product.id}</small>
                                </span>
                              </div>
                            </td>
                            <td>{product.categoryName || "Uncategorized"}</td>
                            <td className="table-price">
                              {formatPrice(product.price)}
                            </td>
                            <td>
                              <span
                                className={`stock-label ${
                                  product.stockQuantity <= 5 ? "low" : ""
                                }`}
                              >
                                {product.stockQuantity}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`status-pill ${
                                  product.isAvailable ? "available" : "unavailable"
                                }`}
                              >
                                {product.isAvailable ? "Available" : "Unavailable"}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  type="button"
                                  className="table-action"
                                  title="Manage inventory"
                                  aria-label={`Manage inventory for ${product.name}`}
                                  onClick={() => openInventory(product)}
                                >
                                  <Package size={16} />
                                </button>

                                <button
                                  type="button"
                                  className="table-action"
                                  title="Edit product"
                                  aria-label={`Edit ${product.name}`}
                                  onClick={() => openEditProduct(product)}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="table-action danger"
                                  title="Delete product"
                                  aria-label={`Delete ${product.name}`}
                                  onClick={() => handleDeleteProduct(product)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {!filteredAdminProducts.length && (
                      <div className="empty-state">
                        <Package size={30} />
                        <h3>No matching products</h3>
                        <p>Try changing your search or add a new product.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <p className="admin-note">
                <Settings size={15} />
                Inventory adjustments and category editing will be added in the
                next admin steps. Editing product details does not change existing
                stock quantities.
              </p>
            </>
          ) : (
            <>
              {adminError && (
                <div className="alert alert-error">
                  <AlertCircle size={18} />
                  <span>{adminError}</span>
                  <button
                    type="button"
                    onClick={() => setAdminError("")}
                    aria-label="Dismiss message"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <section className="admin-table-card">
                {salesLoading ? (
                  <div className="empty-state">
                    <RefreshCw className="spin" size={25} />
                    <p>Loading sales...</p>
                  </div>
                ) : salesHistory.length > 0 ? (
                  <>
                    <div className="table-scroll">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Receipt #</th>
                            <th>Date & Time</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Cash Received</th>
                            <th>Change</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesHistory.map((sale) => (
                            <tr key={sale.id}>
                              <td>
                                <strong>#{sale.id}</strong>
                              </td>
                              <td>
                                {new Date(sale.createdAt).toLocaleString("en-PH")}
                              </td>
                              <td>{sale.items?.length || 0}</td>
                              <td className="table-price">
                                {formatPrice(sale.totalAmount)}
                              </td>
                              <td>{formatPrice(sale.cashReceived)}</td>
                              <td>{formatPrice(sale.changeDue)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="table-action"
                                  title="View details"
                                  onClick={() => setSelectedSale(sale)}
                                >
                                  <ShoppingBag size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pagination-controls">
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={salesPage <= 1 || salesLoading}
                        onClick={() => loadSalesHistory(salesPage - 1)}
                      >
                        ← Previous
                      </button>
                      <span className="pagination-info">
                        Page {salesPage} of {salesTotalPages}
                      </span>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={salesPage >= salesTotalPages || salesLoading}
                        onClick={() => loadSalesHistory(salesPage + 1)}
                      >
                        Next →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <ShoppingBag size={32} />
                    <h3>No sales yet</h3>
                    <p>Completed transactions will appear here.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      )}

      {selectedSale && (
        <div className="modal-backdrop" onClick={() => setSelectedSale(null)}>
          <section
            className="checkout-modal receipt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="receipt-success-icon">
              <CheckCircle size={34} />
            </div>
            <span className="eyebrow">SALE DETAILS</span>
            <h2 id="sale-detail-title">Receipt #{selectedSale.id}</h2>
            <p className="receipt-number">
              {new Date(selectedSale.createdAt).toLocaleString("en-PH")}
            </p>

            <div className="receipt-items">
              {(selectedSale.items || []).map((item) => (
                <div className="receipt-line" key={item.id}>
                  <span>
                    {item.quantity} × {item.productName}
                  </span>
                  <strong>{formatPrice(item.lineTotal)}</strong>
                </div>
              ))}
            </div>

            <div className="receipt-totals">
              <div className="receipt-line">
                <span>Total</span>
                <strong>{formatPrice(selectedSale.totalAmount)}</strong>
              </div>
              <div className="receipt-line">
                <span>Cash received</span>
                <span>{formatPrice(selectedSale.cashReceived)}</span>
              </div>
              <div className="receipt-line">
                <span>Change</span>
                <strong>{formatPrice(selectedSale.changeDue)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="checkout-button"
              onClick={() => setSelectedSale(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}

      {productModalOpen && (
        <div className="modal-backdrop" onClick={closeProductModal}>
          <section
            className="checkout-modal product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">
                  {editingProduct ? "UPDATE CATALOG" : "EXPAND YOUR MENU"}
                </span>
                <h2 id="product-modal-title">
                  {editingProduct ? "Edit product" : "Add product"}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeProductModal}
                disabled={savingProduct}
                aria-label="Close product form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <label className="form-field">
                <span>Product name *</span>
                <input
                  autoFocus
                  maxLength={120}
                  required
                  value={productForm.name}
                  onChange={(event) =>
                    updateFormField("name", event.target.value)
                  }
                  placeholder="e.g. Caramel Latte"
                />
              </label>

              <div className="form-grid">
                <label className="form-field">
                  <span>Price (PHP) *</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(event) =>
                      updateFormField("price", event.target.value)
                    }
                    placeholder="150.00"
                  />
                </label>

                {!editingProduct && (
                  <label className="form-field">
                    <span>Initial stock *</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={productForm.stockQuantity}
                      onChange={(event) =>
                        updateFormField("stockQuantity", event.target.value)
                      }
                    />
                  </label>
                )}
              </div>

              <label className="form-field">
                <span>Category</span>
                <select
                  value={productForm.categoryId}
                  onChange={(event) =>
                    updateFormField("categoryId", event.target.value)
                  }
                >
                  <option value="">Uncategorized</option>
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="availability-toggle">
                <span>
                  <strong>Available for sale</strong>
                  <small>Show this product in the cashier menu.</small>
                </span>
                <input
                  type="checkbox"
                  checked={productForm.isAvailable}
                  onChange={(event) =>
                    updateFormField("isAvailable", event.target.checked)
                  }
                />
              </label>

              {editingProduct && (
                <p className="form-help">
                  Current stock: {editingProduct.stockQuantity}. Use Inventory
                  Management to change stock and record the reason.
                </p>
              )}

              {adminError && (
                <div className="alert alert-error">
                  <AlertCircle size={17} />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={savingProduct}
                  onClick={closeProductModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingProduct}
                >
                  {savingProduct ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={17} />
                      {editingProduct ? "Save changes" : "Add product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {paymentOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !submitting && setPaymentOpen(false)}
        >
          <section
            className="checkout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">CASH PAYMENT</span>
                <h2 id="payment-title">Complete your order</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                disabled={submitting}
                onClick={() => setPaymentOpen(false)}
                aria-label="Close payment"
              >
                <X size={20} />
              </button>
            </div>

            <div className="payment-total">
              <span>Total due</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <form onSubmit={handleCheckout}>
              <label className="form-field">
                <span>Cash received (PHP)</span>
                <input
                  autoFocus
                  type="number"
                  min={subtotal}
                  step="0.01"
                  required
                  value={cashReceived}
                  onChange={(event) => setCashReceived(event.target.value)}
                  placeholder="Enter amount received"
                />
              </label>

              <div className="change-preview">
                <span>Change due</span>
                <strong>
                  {formatPrice(Math.max(0, Number(cashReceived || 0) - subtotal))}
                </strong>
              </div>

              {checkoutError && (
                <div className="alert alert-error">
                  <AlertCircle size={17} />
                  <span>{checkoutError}</span>
                </div>
              )}

              <button
                type="submit"
                className="checkout-button"
                disabled={
                  submitting ||
                  !cashReceived ||
                  Number(cashReceived) < subtotal
                }
              >
                {submitting ? "Processing..." : "Confirm cash payment"}
              </button>
            </form>
          </section>
        </div>
      )}

      {inventoryProduct && (
        <div className="modal-backdrop" onClick={() => setInventoryProduct(null)}>
          <section
            className="checkout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">INVENTORY MANAGEMENT</span>
                <h2 id="inventory-modal-title">{inventoryProduct.name}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setInventoryProduct(null)}
                disabled={inventorySaving}
                aria-label="Close inventory"
              >
                <X size={20} />
              </button>
            </div>

            <div className="inventory-current-stock">
              <span>Current stock</span>
              <strong>{inventoryProduct.stockQuantity}</strong>
            </div>

            <form onSubmit={handleInventoryAdjustment}>
              <label className="form-field">
                <span>Adjustment type</span>
                <select
                  value={adjustmentForm.type}
                  onChange={(event) =>
                    setAdjustmentForm((current) => ({
                      ...current,
                      type: event.target.value,
                    }))
                  }
                  disabled={inventorySaving}
                >
                  <option value="in">Stock In (receive)</option>
                  <option value="out">Stock Out (remove)</option>
                </select>
              </label>

              <label className="form-field">
                <span>Quantity</span>
                <input
                  autoFocus
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={adjustmentForm.quantity}
                  onChange={(event) =>
                    setAdjustmentForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  disabled={inventorySaving}
                  placeholder="Enter quantity"
                />
              </label>

              <label className="form-field">
                <span>Reason *</span>
                <input
                  type="text"
                  maxLength={200}
                  required
                  value={adjustmentForm.reason}
                  onChange={(event) =>
                    setAdjustmentForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  disabled={inventorySaving}
                  placeholder="e.g. Supplier delivery, damaged stock, inventory count"
                />
              </label>

              {inventoryError && (
                <div className="alert alert-error">
                  <AlertCircle size={17} />
                  <span>{inventoryError}</span>
                </div>
              )}

              {inventorySuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={17} />
                  <span>{inventorySuccess}</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={inventorySaving}
                  onClick={() => setInventoryProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={inventorySaving}
                >
                  {inventorySaving ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      Adjusting...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={17} />
                      Record adjustment
                    </>
                  )}
                </button>
              </div>
            </form>

            {inventoryLoading ? (
              <div className="inventory-history">
                <p className="inventory-history-title">Stock history</p>
                <div className="empty-state" style={{ marginTop: "16px" }}>
                  <RefreshCw className="spin" size={22} />
                  <p>Loading history...</p>
                </div>
              </div>
            ) : inventoryHistory.length > 0 ? (
              <div className="inventory-history">
                <p className="inventory-history-title">Stock history</p>
                <div className="inventory-history-list">
                  {inventoryHistory.map((adjustment) => (
                    <div key={adjustment.id} className="history-item">
                      <div className="history-item-main">
                        <span className="history-item-quantity">
                          {adjustment.quantityChange > 0 ? "+" : ""}
                          {adjustment.quantityChange}
                        </span>
                        <div>
                          <strong>{adjustment.reason}</strong>
                          <small>
                            {adjustment.stockBefore} → {adjustment.stockAfter}
                          </small>
                        </div>
                      </div>
                      <span className="history-item-date">
                        {new Date(adjustment.createdAt).toLocaleString(
                          "en-PH",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ marginTop: "20px" }}>
                <Package size={28} />
                <p>No adjustments yet</p>
              </div>
            )}
          </section>
        </div>
      )}

      {receipt && (
        <div className="modal-backdrop">
          <section
            className="checkout-modal receipt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
          >
            <div className="receipt-success-icon">
              <CheckCircle size={34} />
            </div>
            <span className="eyebrow">PAYMENT SUCCESSFUL</span>
            <h2 id="receipt-title">Thank you!</h2>
            <p className="receipt-number">Receipt #{receipt.id}</p>

            <div className="receipt-items">
              {(receipt.items || []).map((item) => (
                <div className="receipt-line" key={item.id}>
                  <span>
                    {item.quantity} × {item.productName}
                  </span>
                  <strong>{formatPrice(item.lineTotal)}</strong>
                </div>
              ))}
            </div>

            <div className="receipt-totals">
              <div className="receipt-line">
                <span>Total</span>
                <strong>{formatPrice(receipt.totalAmount)}</strong>
              </div>
              <div className="receipt-line">
                <span>Cash received</span>
                <span>{formatPrice(receipt.cashReceived)}</span>
              </div>
              <div className="receipt-line">
                <span>Change</span>
                <strong>{formatPrice(receipt.changeDue)}</strong>
              </div>
            </div>

            <p className="receipt-date">
              {receipt.createdAt
                ? new Date(receipt.createdAt).toLocaleString("en-PH")
                : ""}
            </p>

            <button
              type="button"
              className="checkout-button"
              onClick={() => setReceipt(null)}
            >
              New order
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
