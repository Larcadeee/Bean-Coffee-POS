
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

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();

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

  function addToCart(product) {
    if (!product.isAvailable || product.stockQuantity <= 0) return;

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

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
      currentCart
        .map((item) => {
          if (item.id !== productId) return item;

          const nextQuantity = item.quantity + change;

          if (nextQuantity < 1) return item;
          if (nextQuantity > item.stockQuantity) return item;

          return { ...item, quantity: nextQuantity };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  function formatPrice(amount) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
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
                        <strong>{formatPrice(Number(product.price))}</strong>
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
                    >
                      <Minus size={15} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={item.quantity >= item.stockQuantity}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      className="remove-button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name}`}
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
              disabled={cart.length === 0}
              onClick={() =>
                window.alert(
                  "Checkout will be implemented in the next step."
                )
              }
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
    </div>
  );
}

export default App;
