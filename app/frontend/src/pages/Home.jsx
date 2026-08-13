import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/api/products?featured=true&limit=12');
        setFeatured(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const row1 = featured.slice(0, Math.ceil(featured.length / 2));
  const row2 = featured.slice(Math.ceil(featured.length / 2));

  const itemWidth = 344; // 320px width + 24px gap

  // Auto-scroll logic for Row 1
  useEffect(() => {
    if (!loading && row1.length > 0) {
      const interval = setInterval(() => {
        if (row1Ref.current) {
          const { scrollLeft, scrollWidth, clientWidth } = row1Ref.current;
          // If we hit the end of the scroll, smoothly slide back to the beginning
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            row1Ref.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            row1Ref.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
          }
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading, row1.length]);

  // Auto-scroll logic for Row 2
  useEffect(() => {
    if (!loading && row2.length > 0) {
      const interval = setInterval(() => {
        if (row2Ref.current) {
          const { scrollLeft, scrollWidth, clientWidth } = row2Ref.current;
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            row2Ref.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            row2Ref.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
          }
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [loading, row2.length]);

  const scrollRow = (ref, direction) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      
      if (direction === 'left') {
        // If at the very beginning, snap to the end
        if (scrollLeft <= 0) {
          ref.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
        } else {
          ref.current.scrollBy({ left: -itemWidth, behavior: 'smooth' });
        }
      } else {
        // If at the very end, snap to the beginning
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          ref.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          ref.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <div className="page-enter">
      {/* Hero Section */}
      <section style={{ 
        position: 'relative', height: '80vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(to right, var(--bg-primary) 20%, rgba(15,17,21,0.5)), url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80) center/cover'
      }}>
        <div className="container">
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
              Elevate Your <span className="text-accent-gradient">Lifestyle</span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              Discover our premium collection of meticulously crafted products designed for the modern aesthetic.
            </p>
            <div className="flex gap-4">
              <Link to="/shop" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Shop Collection <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container grid grid-cols-3 gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>Free Express Shipping</h3>
            <p style={{ color: 'var(--text-muted)' }}>On all orders over ₹999 across India.</p>
          </div>
          <div className="flex flex-col items-center gap-4 text-center">
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>Secure Payments</h3>
            <p style={{ color: 'var(--text-muted)' }}>100% secure checkout powered by Razorpay.</p>
          </div>
          <div className="flex flex-col items-center gap-4 text-center">
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>Premium Quality</h3>
            <p style={{ color: 'var(--text-muted)' }}>Handpicked selection of the finest goods.</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '6rem 0' }}>
        <div className="container">
          <div className="flex justify-between items-center" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem' }}>Featured <span className="text-accent-gradient">Products</span></h2>
            <Link to="/shop" style={{ color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
              View All <ArrowRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner"></div></div>
          ) : (
            <div style={{ width: '100%' }}>
              
              {/* Row 1 Carousel */}
              <div style={{ position: 'relative', marginBottom: '3rem' }}>
                <button 
                  className="carousel-btn-left"
                  onClick={() => scrollRow(row1Ref, 'left')}
                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '50%', border: '1px solid var(--border-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div 
                  ref={row1Ref}
                  className="flex gap-6 no-scrollbar snap-x" 
                  style={{ overflowX: 'auto', paddingBottom: '1rem', scrollBehavior: 'smooth' }}
                >
                  {row1.map((product) => (
                    <div key={product.id} className="snap-start product-carousel-item" style={{ flexShrink: 0 }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                <button 
                  className="carousel-btn-right"
                  onClick={() => scrollRow(row1Ref, 'right')}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Row 2 Carousel */}
              {row2.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button 
                    className="carousel-btn-left"
                    onClick={() => scrollRow(row2Ref, 'left')}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div 
                    ref={row2Ref}
                    className="flex gap-6 no-scrollbar snap-x" 
                    style={{ overflowX: 'auto', paddingBottom: '1rem', scrollBehavior: 'smooth' }}
                  >
                    {row2.map((product) => (
                      <div key={product.id} className="snap-start product-carousel-item" style={{ flexShrink: 0 }}>
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>

                  <button 
                    className="carousel-btn-right"
                    onClick={() => scrollRow(row2Ref, 'right')}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
