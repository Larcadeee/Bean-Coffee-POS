
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
  X,
  Banknote,
  CheckCircle,
  Receipt,
} from "lucide-react";
import "./App.css";

const API_BASE_URL = "http://localhost:5080/api";

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  async function loadCatalog() {
    setLoading(true);
    setError("");

    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/categories`),
      ]);

      if (!productsResponse.ok || !categoriesResponse.ok) {
        throw new Error("The API returned an unsuccessful response.");
      }

      const [productsData, categoriesData] = await Promise.all([
        productsResponse.json(),
        categoriesResponse.json(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Catalog loading failed:", err);
      setError(
        "Unable to load products. Make sure your ASP.NET Core API is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchCatalog() {
      setError("");

      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/products`),
          fetch(`${API_BASE_URL}/categories`),
        ]);

        if (!productsResponse.ok || !categoriesResponse.ok) {
          throw new Error("The API returned an unsuccessful response.");
        }

        const [productsData, categoriesData] = await Promise.all([
          productsResponse.json(),
          categoriesResponse.json(),
        ]);

        if (!cancelled) {
          setProducts(productsData);
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error("Catalog loading failed:", err);

        if (!cancelled) {
          setError(
            "Unable to load products. Make sure your ASP.NET Core API is running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        product.categoryName === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cashAmount = cashReceived.trim() === "" ? 0 : Number(cashReceived);
  const validCashInput =
    cashReceived.trim() !== "" &&
    Number.isFinite(cashAmount) &&
    cashAmount >= 0;

  const changeDue = validCashInput
    ? Math.max(0, cashAmount - subtotal)
    : 0;

  function formatPrice(amount) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount) || 0);
  }

  function addToCart(product) {
    if (!product.isAvailable || product.stockQuantity <= 0) return;

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
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
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== productId) return item;

        const nextQuantity = item.quantity + change;

        if (nextQuantity < 1) return item;
        if (nextQuantity > item.stockQuantity) return item;

        return { ...item, quantity: nextQuantity };
      })
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  function openPayment() {
    setCashReceived("");
    setCheckoutError("");
    setPaymentOpen(true);
  }

  async function handleCheckout(event) {
    event.preventDefault();

    if (submitting) return;

    if (cart.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    if (!validCashInput) {
      setCheckoutError("Enter a valid cash amount.");
      return;
    }

    if (cashAmount < subtotal) {
      setCheckoutError("Cash received must cover the total amount.");
      return;
    }

    setSubmitting(true);
    setCheckoutError("");

    try {
      const response = await fetch(`${API_BASE_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cashReceived: cashAmount,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.message ||
          data?.title ||
          (typeof data === "string" ? data : null) ||
          `Checkout failed (HTTP ${response.status}).`;

        throw new Error(message);
      }

      setReceipt(data);
      setCart([]);
      setPaymentOpen(false);
      setCashReceived("");

      // Refresh stock and product information after a successful sale.
      await loadCatalog();
    } catch (err) {
      console.error("Checkout failed:", err);
      setCheckoutError(
        err instanceof TypeError
          ? "Could not connect to the sales API. Check that the backend is running."
          : err.message || "Unable to complete the sale. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function closePayment() {
    if (submitting) return;

    setPaymentOpen(false);
    setCheckoutError("");
  }

  function closeReceipt() {
    setReceipt(null);
  }

  return (
    <div className="pos-app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Bean Coffee POS home">
          <span className="brand-icon">
            <Coffee size={23} />
          </span>
          <span>
            <strong>bean.</strong>
            <small>COFFEE POS</small>
          </span>
        </a>

        <div className="topbar-status">
          <span className="status-dot" />
          Point of Sale
        </div>
      </header>

      <main className="pos-layout">
        <section className="catalog-section">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR DAILY BREW</p>
              <h1>Make it a good cup.</h1>
              <p className="subheading">
                Fresh coffee, made just the way you like it.
              </p>
            </div>

            <button
              className="icon-button"
              onClick={loadCatalog}
              title="Refresh catalog"
              aria-label="Refresh catalog"
              disabled={loading}
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="catalog-tools">
            <label className="search-box">
              <Search size={19} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search coffee, tea, and more..."
              />
            </label>
          </div>

          <div className="category-list">
            {["All", ...categories.map((category) => category.name)].map(
              (category) => (
                <button
                  key={category}
                  className={`category-chip ${
                    selectedCategory === category ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              )
            )}
          </div>

          {error && (
            <div className="error-message" role="alert">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button onClick={loadCatalog}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              <RefreshCw className="loading-icon" size={28} />
              <p>Preparing your catalog...</p>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => {
                const unavailable =
                  !product.isAvailable || product.stockQuantity <= 0;

                return (
                  <article className="product-card" key={product.id}>
                    <div className="product-art">
                      <span className="product-art-icon">
                        <Coffee size={38} strokeWidth={1.4} />
                      </span>
                      <span className="product-category">
                        {product.categoryName || "Uncategorized"}
                      </span>
                    </div>

                    <div className="product-details">
                      <h3>{product.name}</h3>
                      <p className="product-stock">
                        <Package size={14} />
                        {product.stockQuantity} in stock
                      </p>

                      <div className="product-card-footer">
                        <strong>
                          {formatPrice(Number(product.price))}
                        </strong>
                        <button
                          className="add-button"
                          onClick={() => addToCart(product)}
                          disabled={unavailable}
                          aria-label={`Add ${product.name} to cart`}
                          title={
                            unavailable
                              ? "Product unavailable or out of stock"
                              : "Add to cart"
                          }
                        >
                          <Plus size={19} />
                        </button>
                      </div>

                      {unavailable && (
                        <p className="unavailable-label">
                          {product.isAvailable
                            ? "Out of stock"
                            : "Unavailable"}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="empty-state">
              <Coffee size={30} />
              <p>No products found. Try another search.</p>
            </div>
          )}
        </section>

        <aside className="cart-panel">
          <div className="cart-heading">
            <div>
              <p className="eyebrow">CURRENT ORDER</p>
              <h2>My Order</h2>
            </div>
            <span className="cart-count">{cartCount}</span>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <span className="cart-empty-icon">
                  <ShoppingBag size={27} />
                </span>
                <h3>Your order is empty</h3>
                <p>Select a product to start an order.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-info">
                    <strong>{item.name}</strong>
                    <span>{formatPrice(item.price)} each</span>
                    <b>{formatPrice(item.price * item.quantity)}</b>
                  </div>

                  <div className="cart-item-controls">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      aria-label={`Decrease ${item.name} quantity`}
                      disabled={submitting}
                    >
                      <Minus size={15} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={
                        submitting || item.quantity >= item.stockQuantity
                      }
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      className="remove-button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name}`}
                      disabled={submitting}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div className="summary-line">
              <span>Items</span>
              <span>{cartCount}</span>
            </div>
            <div className="summary-line total-line">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <p className="checkout-note">
              Cash payment · Discounts not yet enabled
            </p>
            <button
              className="checkout-button"
              disabled={cart.length === 0 || submitting}
              onClick={openPayment}
            >
              Continue to payment
            </button>
          </div>
        </aside>
      </main>

      <footer className="app-footer">
        <span>BEAN COFFEE POS</span>
        <span>Simple service. Great coffee.</span>
      </footer>

      {paymentOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePayment();
          }}
        >
          <section
            className="checkout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
          >
            <div className="modal-heading">
              <div className="modal-title-icon">
                <Banknote size={22} />
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closePayment}
                disabled={submitting}
                aria-label="Close payment"
              >
                <X size={20} />
              </button>
            </div>

            <p className="eyebrow">PAYMENT</p>
            <h2 id="payment-title">Complete your order</h2>
            <p className="modal-description">
              Confirm the total and enter the cash received from the customer.
            </p>

            <form onSubmit={handleCheckout}>
              <div className="payment-total">
                <span>Total amount</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <label className="payment-field">
                <span>Cash received (PHP)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={cashReceived}
                  onChange={(event) => {
                    setCashReceived(event.target.value);
                    setCheckoutError("");
                  }}
                  disabled={submitting}
                  autoFocus
                  required
                />
              </label>

              <div className="payment-change">
                <span>Change due</span>
                <strong>{formatPrice(changeDue)}</strong>
              </div>

              {validCashInput && cashAmount < subtotal && (
                <p className="payment-hint">
                  Short by {formatPrice(subtotal - cashAmount)}.
                </p>
              )}

              {checkoutError && (
                <div className="error-message checkout-error" role="alert">
                  <AlertCircle size={18} />
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closePayment}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="checkout-button"
                  disabled={
                    submitting ||
                    cart.length === 0 ||
                    !validCashInput ||
                    cashAmount < subtotal
                  }
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={17} className="loading-icon" />
                      Processing...
                    </>
                  ) : (
                    "Confirm payment"
                  )}
                </button>
              </div>
            </form>
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
              <CheckCircle size={32} />
            </div>
            <p className="eyebrow">PAYMENT SUCCESSFUL</p>
            <h2 id="receipt-title">Thank you!</h2>
            <p className="modal-description">
              The sale has been saved and inventory has been updated.
            </p>

            <div className="receipt-number">
              <Receipt size={18} />
              <span>Receipt #{receipt.id}</span>
            </div>

            <div className="receipt-items">
              {(receipt.items || []).map((item) => (
                <div className="receipt-item" key={item.id}>
                  <div>
                    <strong>{item.productName}</strong>
                    <span>
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </span>
                  </div>
                  <b>{formatPrice(item.lineTotal)}</b>
                </div>
              ))}
            </div>

            <div className="receipt-totals">
              <div>
                <span>Total</span>
                <strong>{formatPrice(receipt.totalAmount)}</strong>
              </div>
              <div>
                <span>Cash received</span>
                <strong>{formatPrice(receipt.cashReceived)}</strong>
              </div>
              <div className="receipt-change">
                <span>Change due</span>
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
              className="checkout-button receipt-done"
              onClick={closeReceipt}
            >
              Done
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
