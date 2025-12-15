import React, { lazy, Suspense, useEffect, useState, useCallback, memo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import './globals.css';
import './App.css';
import { NotificationProvider, useNotification } from "./context/NotificationContext";
import { setNotificationHandler, resetUnauthorizedErrorFlag, clearCache } from "./services/axios";
import store from "./redux/store";
import GlobalLoader from "./components/GlobalLoader";

// Lazy load all pages for optimal performance
const LoginPage = lazy(() => import("./pages/login"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const FormPage = lazy(() => import("./pages/valuationform"));
const EditValuationPage = lazy(() => import("./pages/ubiShop.jsx"));
const BofMaharastraEditForm = lazy(() => import("./pages/bomflat.jsx"));
const UbiApfEditForm = lazy(() => import("./pages/ubiApf.jsx"));

const BillsPage = lazy(() => import("./pages/billspage"));
const BillForm = lazy(() => import("./components/BillForm"));
const BillDetailPage = lazy(() => import("./pages/billdetailpage"));

// Memoized loader component to prevent unnecessary re-renders
const PageLoader = memo(() => (
    <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-4">
        <style>
            {`
              @keyframes pulse {
                0%, 100% { stroke-dasharray: 125 220; }
                50% { stroke-dasharray: 220 220; }
              }
              @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
        </style>
        <div className="flex flex-col items-center gap-8 max-w-md">
            <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#F36E21]/30 via-[#EC5E25]/20 to-[#FFC547]/30 rounded-3xl blur-2xl opacity-60"></div>
                <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-12 shadow-2xl">
                    <div className="flex justify-center items-center mb-8">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#F36E21] to-[#FFC547] opacity-20 blur-lg"></div>
                            <svg className="w-20 h-20" viewBox="0 0 100 100" style={{ animation: 'rotate 3s linear infinite' }}>
                                <defs>
                                    <linearGradient id="premiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#F36E21" stopOpacity="1" />
                                        <stop offset="50%" stopColor="#EC5E25" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#FFC547" stopOpacity="0.6" />
                                    </linearGradient>
                                </defs>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="url(#premiumGradient)" strokeWidth="3" strokeDasharray="125 220" strokeLinecap="round" style={{ animation: 'pulse 2s ease-in-out infinite', filter: 'drop-shadow(0 0 8px rgba(243, 110, 33, 0.5))' }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-gradient-to-r from-[#F36E21] to-[#FFC547] rounded-full" style={{ animation: 'pulse 2s ease-in-out infinite' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center space-y-3">
                        <h3 className="text-white font-semibold text-lg tracking-wide">Loading</h3>
                        <p className="text-xs text-white/60 font-medium tracking-widest uppercase">Please wait</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
));

PageLoader.displayName = "PageLoader";

// Error Boundary for lazy loaded components
const ErrorFallback = memo(() => (
    <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-4">
        <div className="flex flex-col items-center gap-8 max-w-md">
            <div className="relative">
                <div className="relative bg-white/10 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-12 shadow-2xl">
                    <div className="text-center space-y-4">
                        <h3 className="text-red-400 font-semibold text-lg tracking-wide">Error Loading Page</h3>
                        <p className="text-xs text-white/60 font-medium">Please refresh the page</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2 bg-[#F36E21] hover:bg-[#EC5E25] text-white rounded-lg font-semibold transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
));

ErrorFallback.displayName = "ErrorFallback";

// Simple Error Boundary
class SimpleErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback />;
        }
        return this.props.children;
    }
}

function AppContent() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { hideUnauthorizedError, showUnauthorizedError } = useNotification();

    // Initialize notification handler
    useEffect(() => {
        setNotificationHandler({ showUnauthorizedError, hideUnauthorizedError });
    }, [showUnauthorizedError, hideUnauthorizedError]);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    // Memoized login handler
    const handleLogin = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        clearCache(); // Clear cache to fetch fresh data on login
        hideUnauthorizedError();
        resetUnauthorizedErrorFlag();
    }, [hideUnauthorizedError]);

    // Memoized logout handler
    const handleLogout = useCallback(() => {
        setUser(null);
        localStorage.removeItem("user");
        clearCache(); // Clear all cached data on logout
    }, []);

    // Protected Route component
    const ProtectedRoute = useCallback(({ children }) => {
        if (loading) return <PageLoader />;
        return children;
    }, [loading]);

    // Public Route component
    const PublicRoute = useCallback(({ children }) => {
        if (loading) return <PageLoader />;
        return !user ? children : <Navigate to="/dashboard" replace />;
    }, [loading, user]);

    if (loading) return <PageLoader />;

    return (
        <SimpleErrorBoundary>
            <Routes>
                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Login - Public Route with Lazy Loading */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Suspense fallback={<PageLoader />}>
                                <LoginPage onLogin={handleLogin} />
                            </Suspense>
                        </PublicRoute>
                    }
                />

                {/* Dashboard - Protected Route with Lazy Loading */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                                <DashboardPage user={user} onLogout={handleLogout} onLogin={handleLogin} />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Create Form - Protected Route with Lazy Loading */}
                <Route
                    path="/valuationform"
                    element={
                        <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                                <FormPage user={user} onLogin={handleLogin} />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Edit Form - Protected Route with Lazy Loading */}
                <Route
                    path="/valuationeditform/:id"
                    element={
                        <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                                <EditValuationPage user={user} onLogin={handleLogin} />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Edit Form - Union Bank - Protected Route with Lazy Loading */}
                <Route
                    path="/valuationeditformunion/:id"
                    element={
                        <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                                <EditValuationPage user={user} onLogin={handleLogin} />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Edit Form - Bomaharastra - Protected Route with Lazy Loading */}
                <Route
                    path="/valuationeditformbomaharastra/:id"
                    element={
                        <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                                <BofMaharastraEditForm user={user} onLogin={handleLogin} />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Edit Form - UBI APF - Protected Route with Lazy Loading */}
                <Route
                    path="/valuationeditformubiapf/:id"
                    element={
                        <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                                <UbiApfEditForm user={user} onLogin={handleLogin} />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Bills - Protected Route with Lazy Loading */}
                <Route
                    path="/bills"
                    element={
                        <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                                <BillsPage user={user} onLogin={handleLogin} />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Create Bill - Protected Route with Lazy Loading */}
                <Route
                    path="/bills/create"
                    element={
                        <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                                <BillForm user={user} onLogin={handleLogin} />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Edit Bill - Protected Route with Lazy Loading */}
                <Route
                    path="/bills/edit/:id"
                    element={
                        <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                                <BillForm user={user} onLogin={handleLogin} />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* View Bill - Protected Route with Lazy Loading */}
                <Route
                    path="/bills/:id"
                    element={
                        <ProtectedRoute>
                            <Suspense fallback={<PageLoader />}>
                                <BillDetailPage user={user} onLogin={handleLogin} />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Catch all - redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </SimpleErrorBoundary>
    );
}

function App() {
    return (
        <Provider store={store}>
            <NotificationProvider>
                <BrowserRouter>
                    <GlobalLoader />
                    <AppContent />
                </BrowserRouter>
            </NotificationProvider>
        </Provider>
    );
}

export default App;
