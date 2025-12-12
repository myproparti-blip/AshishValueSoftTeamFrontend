import React, { useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
    ScatterChart,
    Scatter,
    ComposedChart,
    Area,
    AreaChart,
} from "recharts";
import { Card, CardContent } from "./ui";
import { FaChartBar, FaArrowUp, FaCheckCircle, FaHourglass, FaTrendingUp, FaFireAlt, FaBolt, FaAward } from "react-icons/fa";

const StatusGraph = ({ files, isCompact = false }) => {
    const [activeTab, setActiveTab] = useState("status");

    // Prepare data for status distribution (Bar Chart)
    const statusData = useMemo(() => {
        const statusCounts = {
            pending: 0,
            "on-progress": 0,
            approved: 0,
            rejected: 0,
            rework: 0,
        };

        files.forEach((file) => {
            if (statusCounts.hasOwnProperty(file.status)) {
                statusCounts[file.status]++;
            }
        });

        return [
            { name: "Pending", value: statusCounts.pending, fill: "#f59e0b", lightFill: "#fef3c7", darkFill: "#92400e" },
            { name: "In Progress", value: statusCounts["on-progress"], fill: "#3b82f6", lightFill: "#dbeafe", darkFill: "#1e40af" },
            { name: "Approved", value: statusCounts.approved, fill: "#10b981", lightFill: "#d1fae5", darkFill: "#065f46" },
            { name: "Rejected", value: statusCounts.rejected, fill: "#ef4444", lightFill: "#fee2e2", darkFill: "#7f1d1d" },
            { name: "Rework", value: statusCounts.rework, fill: "#8b5cf6", lightFill: "#ede9fe", darkFill: "#4c1d95" },
        ];
    }, [files]);

    // Prepare data for bank distribution (Pie Chart)
    const bankData = useMemo(() => {
        const bankCounts = {};
        const colors = [
            { fill: "#3b82f6", light: "#dbeafe", dark: "#1e40af" },
            { fill: "#10b981", light: "#d1fae5", dark: "#065f46" },
            { fill: "#f59e0b", light: "#fef3c7", dark: "#92400e" },
            { fill: "#ef4444", light: "#fee2e2", dark: "#7f1d1d" },
            { fill: "#8b5cf6", light: "#ede9fe", dark: "#4c1d95" },
            { fill: "#ec4899", light: "#fbcfe8", dark: "#831843" },
            { fill: "#06b6d4", light: "#cffafe", dark: "#164e63" },
        ];

        files.forEach((file) => {
            if (file.bankName) {
                bankCounts[file.bankName] = (bankCounts[file.bankName] || 0) + 1;
            }
        });

        return Object.entries(bankCounts)
            .map(([name, value], idx) => ({
                name,
                value,
                ...colors[idx % colors.length],
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [files]);

    // Prepare data for city distribution (Bar Chart)
    const cityData = useMemo(() => {
        const cityCounts = {};

        files.forEach((file) => {
            if (file.city) {
                cityCounts[file.city] = (cityCounts[file.city] || 0) + 1;
            }
        });

        return Object.entries(cityCounts)
            .map(([name, value]) => ({
                name,
                count: value,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [files]);

    // Enhanced analytics data
    const analyticsData = useMemo(() => {
        const statusCounts = {
            pending: 0,
            "on-progress": 0,
            approved: 0,
            rejected: 0,
            rework: 0,
        };
        const engineerStats = {};
        const monthlyData = {};
        let totalValue = 0;

        files.forEach((file) => {
            if (statusCounts.hasOwnProperty(file.status)) {
                statusCounts[file.status]++;
            }

            // Engineer stats
            if (file.engineerName) {
                if (!engineerStats[file.engineerName]) {
                    engineerStats[file.engineerName] = { approved: 0, rejected: 0, pending: 0 };
                }
                engineerStats[file.engineerName][file.status]++;
            }

            // Monthly data
            const month = new Date(file.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
            });
            if (!monthlyData[month]) {
                monthlyData[month] = { name: month, submissions: 0, approved: 0, rejected: 0 };
            }
            monthlyData[month].submissions++;
            if (file.status === "approved") monthlyData[month].approved++;
            if (file.status === "rejected") monthlyData[month].rejected++;
        });

        return {
            engineerStats: Object.entries(engineerStats)
                .map(([name, data]) => ({
                    name,
                    ...data,
                    total: data.approved + data.rejected + data.pending,
                    approvalRate: data.total > 0 ? ((data.approved / data.total) * 100).toFixed(1) : 0,
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10),
            monthlyData: Object.values(monthlyData).sort(
                (a, b) => new Date(a.name) - new Date(b.name)
            ),
        };
    }, [files]);

    // Prepare data for payment status (Pie Chart)
    const paymentData = useMemo(() => {
        let collected = 0;
        let notCollected = 0;

        files.forEach((file) => {
            if (file.payment === "yes") {
                collected++;
            } else {
                notCollected++;
            }
        });

        return [
            { name: "Collected", value: collected, fill: "#10b981", light: "#d1fae5", dark: "#065f46" },
            { name: "Not Collected", value: notCollected, fill: "#ef4444", light: "#fee2e2", dark: "#7f1d1d" },
        ];
    }, [files]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border-2 border-gray-200 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-98 transform transition-all">
                    <p className="text-sm font-bold text-gray-900">{payload[0].payload.name || payload[0].name}</p>
                    <p className="text-lg font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    // Stat Card Component
    const StatCard = ({ icon: Icon, label, value, color, trend }) => {
        const colorClasses = {
            blue: "from-blue-50 to-blue-100 border-blue-300 text-blue-700",
            green: "from-green-50 to-green-100 border-green-300 text-green-700",
            red: "from-red-50 to-red-100 border-red-300 text-red-700",
            purple: "from-purple-50 to-purple-100 border-purple-300 text-purple-700",
            amber: "from-amber-50 to-amber-100 border-amber-300 text-amber-700",
        };
        return (
            <div className={`bg-gradient-to-br ${colorClasses[color]} border-2 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</p>
                        <p className="text-3xl font-black mt-2">{value}</p>
                        {trend && <p className="text-xs text-gray-600 mt-2 flex items-center gap-1"><FaArrowUp className="text-green-600" />{trend}</p>}
                    </div>
                    <div className={`${colorClasses[color]} bg-opacity-30 p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                        <Icon className="text-2xl" />
                    </div>
                </div>
            </div>
        );
    };

    const tabButtons = [
        { id: "status", label: "Status", icon: "📊", color: "blue" },
        { id: "payment", label: "Payment", icon: "💳", color: "green" },
        { id: "banks", label: "Banks", icon: "🏦", color: "purple" },
        { id: "cities", label: "Cities", icon: "🏙️", color: "amber" },
        { id: "timeline", label: "Timeline", icon: "📈", color: "indigo" },
        { id: "engineers", label: "Engineers", icon: "👥", color: "pink" },
    ];

    const getTabColor = (color) => {
        const colors = {
            blue: { bg: "from-blue-50 to-blue-100/50", border: "border-blue-300", text: "text-blue-700" },
            green: { bg: "from-green-50 to-green-100/50", border: "border-green-300", text: "text-green-700" },
            purple: { bg: "from-purple-50 to-purple-100/50", border: "border-purple-300", text: "text-purple-700" },
            amber: { bg: "from-amber-50 to-amber-100/50", border: "border-amber-300", text: "text-amber-700" },
            indigo: { bg: "from-indigo-50 to-indigo-100/50", border: "border-indigo-300", text: "text-indigo-700" },
            pink: { bg: "from-pink-50 to-pink-100/50", border: "border-pink-300", text: "text-pink-700" },
        };
        return colors[color] || colors.blue;
    };

    return (
        <Card className={`overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-t-4 border-t-gradient group ${isCompact ? 'h-full' : ''}`} style={{ borderTopColor: "#3b82f6" }}>
            <CardContent className="pt-0 p-0">
                {/* Tab Navigation */}
                <div className={`flex gap-2 border-b-2 border-gray-200 bg-gradient-to-b from-gray-50 via-white to-white overflow-x-auto backdrop-blur-sm ${isCompact ? 'px-2 sm:px-3 py-2' : 'px-3 sm:px-6 py-3'}`}>
                    {tabButtons.map((tab) => {
                        const tabColor = getTabColor(tab.color);
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2 group/tab ${isCompact
                                    ? 'px-2.5 sm:px-4 py-2 text-xs'
                                    : 'px-4 sm:px-6 py-3 text-sm sm:text-base'
                                    } ${isActive
                                        ? `bg-gradient-to-br ${tabColor.bg} ${tabColor.text} ${tabColor.border} border-2 shadow-lg scale-105`
                                        : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-transparent hover:border-gray-200"
                                    }`}
                            >
                                <span className={`inline-block transition-transform group-hover/tab:scale-125 ${isCompact ? 'text-base' : 'text-lg'}`}>{tab.icon}</span>
                                <span className={`hidden ${isCompact ? 'sm:hidden' : 'sm:inline'}`}>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className={`bg-gradient-to-br from-white via-gray-50/30 to-white ${isCompact ? 'pt-3 sm:pt-4 px-2 sm:px-4 pb-4 sm:pb-5' : 'pt-8 sm:pt-10 px-4 sm:px-8 pb-10 sm:pb-12'}`}>
                    {/* Status Tab */}
                    {activeTab === "status" && (
                        <div className="animate-fade-in space-y-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900">Status Distribution</h3>
                                <p className="text-sm text-gray-600 mt-3 font-semibold flex items-center gap-2">
                                    <span className="w-1 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
                                    Overview of all submissions by processing status
                                </p>
                            </div>

                            {/* Statistics Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                                {statusData.map((item, index) => (
                                    <StatCard
                                        key={index}
                                        icon={FaCheckCircle}
                                        label={item.name}
                                        value={item.value}
                                        color={index === 0 ? 'amber' : index === 1 ? 'blue' : index === 2 ? 'green' : index === 3 ? 'red' : 'purple'}
                                    />
                                ))}
                            </div>

                            <div className={`bg-gradient-to-br from-white via-blue-50/40 to-white rounded-3xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 ${isCompact ? 'p-3 sm:p-4' : 'p-8 lg:p-10'}`}>
                                <ResponsiveContainer width="100%" height={isCompact ? 220 : 450}>
                                    <BarChart data={statusData} margin={{ top: 30, right: 40, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} strokeOpacity={0.6} />
                                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: "14px" }} fontWeight="700" />
                                        <YAxis stroke="#6b7280" style={{ fontSize: "14px" }} fontWeight="700" />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />
                                        <Bar dataKey="value" radius={[16, 16, 0, 0]} animationDuration={1000} animationEasing="ease-in-out">
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Payment Tab */}
                    {activeTab === "payment" && (
                        <div className="animate-fade-in space-y-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900">Payment Collection Status</h3>
                                <p className="text-sm text-gray-600 mt-3 font-semibold flex items-center gap-2">
                                    <span className="w-1 h-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full"></span>
                                    Track payment collection across all submissions
                                </p>
                            </div>

                            {/* Payment Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {paymentData.map((item, index) => (
                                    <StatCard
                                        key={index}
                                        icon={FaCheckCircle}
                                        label={item.name}
                                        value={item.value}
                                        color={index === 0 ? 'green' : 'red'}
                                        trend={`${((item.value / paymentData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%`}
                                    />
                                ))}
                            </div>

                            <div className="bg-gradient-to-br from-white via-green-50/40 to-white p-10 rounded-3xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                                <ResponsiveContainer width="100%" height={420}>
                                    <PieChart>
                                        <Pie
                                            data={paymentData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value, percent }) =>
                                                `${name}: ${(percent * 100).toFixed(0)}%`
                                            }
                                            outerRadius={130}
                                            innerRadius={60}
                                            fill="#8884d8"
                                            dataKey="value"
                                            animationDuration={1200}
                                        >
                                            {paymentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Banks Tab */}
                    {activeTab === "banks" && (
                        <div className="animate-fade-in space-y-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900">Top Banks Distribution</h3>
                                <p className="text-sm text-gray-600 mt-3 font-semibold flex items-center gap-2">
                                    <span className="w-1 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></span>
                                    Submissions across banking partners
                                </p>
                            </div>

                            {/* Banks Summary Table */}
                            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Bank</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Count</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Share</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bankData.map((item, index) => {
                                                const total = bankData.reduce((a, b) => a + b.value, 0);
                                                const share = ((item.value / total) * 100).toFixed(1);
                                                return (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors duration-200 group">
                                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                                                {item.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-700">{item.value}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold group-hover:bg-purple-200 transition-colors">{share}%</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white via-purple-50/40 to-white p-10 rounded-3xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                                <ResponsiveContainer width="100%" height={460}>
                                    <PieChart>
                                        <Pie
                                            data={bankData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value, percent }) =>
                                                `${(percent * 100).toFixed(0)}%`
                                            }
                                            outerRadius={140}
                                            innerRadius={50}
                                            fill="#8884d8"
                                            dataKey="value"
                                            animationDuration={1200}
                                        >
                                            {bankData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Cities Tab */}
                    {activeTab === "cities" && cityData.length > 0 && (
                        <div className="animate-fade-in space-y-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900">Top Cities Distribution</h3>
                                <p className="text-sm text-gray-600 mt-3 font-semibold flex items-center gap-2">
                                    <span className="w-1 h-1 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full"></span>
                                    Submissions across top 10 cities
                                </p>
                            </div>

                            {/* Cities Summary */}
                            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">City</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Submissions</th>
                                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cityData.map((item, index) => {
                                                const total = cityData.reduce((a, b) => a + b.count, 0);
                                                const percentage = (item.count / total) * 100;
                                                return (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-amber-50/50 transition-colors duration-200">
                                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.name}</td>
                                                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-700">{item.count}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                                                    <div
                                                                        className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                                                                        style={{ width: `${percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-semibold text-gray-600 w-10 text-right">{percentage.toFixed(0)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white via-amber-50/40 to-white p-10 rounded-3xl border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
                                <ResponsiveContainer width="100%" height={480}>
                                    <BarChart data={cityData} margin={{ top: 30, right: 40, left: 0, bottom: 80 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} strokeOpacity={0.6} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#6b7280"
                                            style={{ fontSize: "14px" }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={100}
                                            fontWeight="700"
                                        />
                                        <YAxis stroke="#6b7280" style={{ fontSize: "14px" }} fontWeight="700" />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(251, 146, 60, 0.1)" }} />
                                        <Bar dataKey="count" fill="#f59e0b" radius={[16, 16, 0, 0]} animationDuration={1000} animationEasing="ease-in-out" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Timeline Tab - Monthly Trend */}
                    {activeTab === "timeline" && analyticsData.monthlyData.length > 0 && (
                        <div className="animate-fade-in space-y-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900">Submission Timeline & Trends</h3>
                                <p className="text-sm text-gray-600 mt-3 font-semibold flex items-center gap-2">
                                    <span className="w-1 h-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full"></span>
                                    Monthly submission volume and approval trends
                                </p>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Total</p>
                                    <p className="text-3xl font-black text-indigo-900 mt-2">{files.length}</p>
                                    <p className="text-xs text-indigo-600 mt-2 font-semibold">Submissions</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Approval</p>
                                    <p className="text-3xl font-black text-green-900 mt-2">{files.filter(f => f.status === "approved").length}</p>
                                    <p className="text-xs text-green-600 mt-2 font-semibold">Approved</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Rejection</p>
                                    <p className="text-3xl font-black text-red-900 mt-2">{files.filter(f => f.status === "rejected").length}</p>
                                    <p className="text-xs text-red-600 mt-2 font-semibold">Rejected</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Rate</p>
                                    <p className="text-3xl font-black text-purple-900 mt-2">
                                        {files.length > 0 ? ((files.filter(f => f.status === "approved").length / files.length) * 100).toFixed(0) : 0}%
                                    </p>
                                    <p className="text-xs text-purple-600 mt-2 font-semibold">Success Rate</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white via-indigo-50/40 to-white p-10 rounded-3xl border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
                                <ResponsiveContainer width="100%" height={480}>
                                    <ComposedChart data={analyticsData.monthlyData} margin={{ top: 30, right: 40, left: 0, bottom: 50 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} strokeOpacity={0.6} />
                                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: "14px" }} fontWeight="700" />
                                        <YAxis stroke="#6b7280" style={{ fontSize: "14px" }} fontWeight="700" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area type="monotone" dataKey="submissions" fill="#4f46e5" stroke="#4f46e5" fillOpacity={0.2} />
                                        <Bar dataKey="approved" fill="#10b981" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="rejected" fill="#ef4444" radius={[8, 8, 0, 0]} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Engineers Tab */}
                    {activeTab === "engineers" && analyticsData.engineerStats.length > 0 && (
                        <div className="animate-fade-in space-y-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900">Engineer Performance Analytics</h3>
                                <p className="text-sm text-gray-600 mt-3 font-semibold flex items-center gap-2">
                                    <span className="w-1 h-1 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full"></span>
                                    Individual engineer statistics and approval rates
                                </p>
                            </div>

                            {/* Engineer Stats Table */}
                            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-pink-50 to-rose-50 border-b-2 border-pink-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Engineer</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Total</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Approved</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Rejected</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Pending</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Success Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analyticsData.engineerStats.map((item, index) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-pink-50/50 transition-colors duration-200">
                                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.name}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                                                            {item.total}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                                                            {item.approved}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                                                            {item.rejected}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                                                            {item.pending}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-500"
                                                                    style={{ width: `${item.approvalRate}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-700 w-12 text-right">{item.approvalRate}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white via-pink-50/40 to-white p-10 rounded-3xl border-2 border-pink-200 shadow-lg hover:shadow-xl transition-all duration-300">
                                <ResponsiveContainer width="100%" height={480}>
                                    <BarChart data={analyticsData.engineerStats} margin={{ top: 30, right: 40, left: 0, bottom: 100 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} strokeOpacity={0.6} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#6b7280"
                                            style={{ fontSize: "14px" }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={120}
                                            fontWeight="700"
                                        />
                                        <YAxis stroke="#6b7280" style={{ fontSize: "14px" }} fontWeight="700" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="approved" fill="#10b981" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="rejected" fill="#ef4444" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default StatusGraph;
