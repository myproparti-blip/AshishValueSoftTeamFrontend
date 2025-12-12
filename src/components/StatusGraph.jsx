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
    ComposedChart,
    Area,
} from "recharts";
import { Card, CardContent } from "./ui";
import { FaChartBar, FaArrowUp, FaCheckCircle, FaHourglass, FaTrendingUp, FaFireAlt, FaBolt, FaAward, FaCreditCard, FaBuilding, FaCity, FaCalendarAlt, FaUsers } from "react-icons/fa";

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
                <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-95 transform transition-all">
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
            blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
            green: "from-green-50 to-green-100 border-green-200 text-green-700",
            red: "from-red-50 to-red-100 border-red-200 text-red-700",
            purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-700",
            amber: "from-amber-50 to-amber-100 border-amber-200 text-amber-700",
            indigo: "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700",
            pink: "from-pink-50 to-pink-100 border-pink-200 text-pink-700",
        };
        return (
            <div className={`bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${isCompact ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</p>
                        <p className="text-2xl font-black mt-2 text-gray-900">{value}</p>
                        {trend && <p className="text-xs text-gray-600 mt-2 flex items-center gap-1"><FaArrowUp className="text-green-600" />{trend}</p>}
                    </div>
                    <div className={`${colorClasses[color]} bg-opacity-40 p-3 rounded-xl shadow-sm`}>
                        <Icon className="text-xl" />
                    </div>
                </div>
            </div>
        );
    };

    const tabButtons = [
        { id: "status", label: "Status", icon: FaChartBar, color: "blue" },
        { id: "payment", label: "Payment", icon: FaCreditCard, color: "green" },
        { id: "banks", label: "Banks", icon: FaBuilding, color: "purple" },
        { id: "cities", label: "Cities", icon: FaCity, color: "amber" },
        { id: "timeline", label: "Timeline", icon: FaCalendarAlt, color: "indigo" },
        { id: "engineers", label: "Engineers", icon: FaUsers, color: "pink" },
    ];

    const getTabColor = (color) => {
        const colors = {
            blue: { bg: "from-blue-500 to-blue-600", hover: "hover:from-blue-600 hover:to-blue-700", text: "text-white", border: "border-blue-500" },
            green: { bg: "from-green-500 to-green-600", hover: "hover:from-green-600 hover:to-green-700", text: "text-white", border: "border-green-500" },
            purple: { bg: "from-purple-500 to-purple-600", hover: "hover:from-purple-600 hover:to-purple-700", text: "text-white", border: "border-purple-500" },
            amber: { bg: "from-amber-500 to-amber-600", hover: "hover:from-amber-600 hover:to-amber-700", text: "text-white", border: "border-amber-500" },
            indigo: { bg: "from-indigo-500 to-indigo-600", hover: "hover:from-indigo-600 hover:to-indigo-700", text: "text-white", border: "border-indigo-500" },
            pink: { bg: "from-pink-500 to-pink-600", hover: "hover:from-pink-600 hover:to-pink-700", text: "text-white", border: "border-pink-500" },
        };
        return colors[color] || colors.blue;
    };

    return (
        <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200 bg-gradient-to-br from-white via-blue-50/5 to-white">
            <CardContent className="p-0">
                {/* Tab Navigation */}
                <div className="flex gap-1 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50 overflow-x-auto px-4 py-3">
                    {tabButtons.map((tab) => {
                        const tabColor = getTabColor(tab.color);
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative rounded-xl font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 group ${isCompact
                                    ? 'px-3 py-2 text-xs'
                                    : 'px-4 py-2.5 text-sm'
                                    } ${isActive
                                        ? `bg-gradient-to-r ${tabColor.bg} ${tabColor.text} border ${tabColor.border} shadow-lg scale-105`
                                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-md"
                                    }`}
                            >
                                <tab.icon className={`transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                                <span>{tab.label}</span>
                                {isActive && (
                                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-current to-transparent"></div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-6">
                    {/* Status Tab */}
                    {activeTab === "status" && (
                        <div className="space-y-5">
                            <div className="pb-2">
                                <h3 className="text-2xl font-black text-gray-900">Status Distribution</h3>
                                <p className="text-sm text-gray-600 mt-1 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
                                    Overview of all submissions by processing status
                                </p>
                            </div>

                            {/* Statistics Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

                            <div className="bg-gradient-to-br from-white via-blue-50/20 to-white rounded-2xl border border-blue-100 shadow-lg p-4">
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} fontWeight="600" />
                                        <YAxis stroke="#6b7280" fontSize={12} fontWeight="600" />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={800}>
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} strokeWidth={2} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Payment Tab */}
                    {activeTab === "payment" && (
                        <div className="space-y-5">
                            <div className="pb-2">
                                <h3 className="text-2xl font-black text-gray-900">Payment Collection Status</h3>
                                <p className="text-sm text-gray-600 mt-1 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full"></span>
                                    Track payment collection across all submissions
                                </p>
                            </div>

                            {/* Payment Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {paymentData.map((item, index) => (
                                    <StatCard
                                        key={index}
                                        icon={FaCreditCard}
                                        label={item.name}
                                        value={item.value}
                                        color={index === 0 ? 'green' : 'red'}
                                        trend={`${((item.value / paymentData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%`}
                                    />
                                ))}
                            </div>

                            <div className="bg-gradient-to-br from-white via-green-50/20 to-white rounded-2xl border border-green-100 shadow-lg p-4">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={paymentData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value, percent }) =>
                                                `${name}: ${(percent * 100).toFixed(0)}%`
                                            }
                                            outerRadius={100}
                                            innerRadius={50}
                                            dataKey="value"
                                            animationDuration={1000}
                                        >
                                            {paymentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} strokeWidth={2} />
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
                        <div className="space-y-5">
                            <div className="pb-2">
                                <h3 className="text-2xl font-black text-gray-900">Top Banks Distribution</h3>
                                <p className="text-sm text-gray-600 mt-1 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></span>
                                    Submissions across banking partners
                                </p>
                            </div>

                            {/* Banks Summary Table */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bank</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Count</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Share</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bankData.map((item, index) => {
                                                const total = bankData.reduce((a, b) => a + b.value, 0);
                                                const share = ((item.value / total) * 100).toFixed(1);
                                                return (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors duration-200 group">
                                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.fill }}></div>
                                                                {item.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-700">{item.value}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold shadow-sm">
                                                                {share}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white via-purple-50/20 to-white rounded-2xl border border-purple-100 shadow-lg p-4">
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={bankData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                            outerRadius={110}
                                            innerRadius={50}
                                            dataKey="value"
                                            animationDuration={1000}
                                        >
                                            {bankData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} strokeWidth={2} />
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
                        <div className="space-y-5">
                            <div className="pb-2">
                                <h3 className="text-2xl font-black text-gray-900">Top Cities Distribution</h3>
                                <p className="text-sm text-gray-600 mt-1 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full"></span>
                                    Submissions across top 10 cities
                                </p>
                            </div>

                            {/* Cities Summary */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">City</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Submissions</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cityData.map((item, index) => {
                                                const total = cityData.reduce((a, b) => a + b.count, 0);
                                                const percentage = (item.count / total) * 100;
                                                return (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-amber-50/30 transition-colors duration-200">
                                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.name}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-700">{item.count}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                                                                    <div
                                                                        className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full shadow-sm"
                                                                        style={{ width: `${percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-700 w-10 text-right">{percentage.toFixed(0)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white via-amber-50/20 to-white rounded-2xl border border-amber-100 shadow-lg p-4">
                                <ResponsiveContainer width="100%" height={330}>
                                    <BarChart data={cityData} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            fontWeight="600"
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis stroke="#6b7280" fontSize={12} fontWeight="600" />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(251, 146, 60, 0.1)" }} />
                                        <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} animationDuration={800} stroke="#f59e0b" strokeWidth={2} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Timeline Tab - Monthly Trend */}
                    {activeTab === "timeline" && analyticsData.monthlyData.length > 0 && (
                        <div className="space-y-5">
                            <div className="pb-2">
                                <h3 className="text-2xl font-black text-gray-900">Submission Timeline & Trends</h3>
                                <p className="text-sm text-gray-600 mt-1 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full"></span>
                                    Monthly submission volume and approval trends
                                </p>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Total</p>
                                    <p className="text-xl font-black text-indigo-900 mt-2">{files.length}</p>
                                    <p className="text-xs text-indigo-600 mt-1 font-semibold">Submissions</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Approval</p>
                                    <p className="text-xl font-black text-green-900 mt-2">{files.filter(f => f.status === "approved").length}</p>
                                    <p className="text-xs text-green-600 mt-1 font-semibold">Approved</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Rejection</p>
                                    <p className="text-xl font-black text-red-900 mt-2">{files.filter(f => f.status === "rejected").length}</p>
                                    <p className="text-xs text-red-600 mt-1 font-semibold">Rejected</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Rate</p>
                                    <p className="text-xl font-black text-purple-900 mt-2">
                                        {files.length > 0 ? ((files.filter(f => f.status === "approved").length / files.length) * 100).toFixed(0) : 0}%
                                    </p>
                                    <p className="text-xs text-purple-600 mt-1 font-semibold">Success Rate</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white via-indigo-50/20 to-white rounded-2xl border border-indigo-100 shadow-lg p-4">
                                <ResponsiveContainer width="100%" height={330}>
                                    <ComposedChart data={analyticsData.monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} fontWeight="600" />
                                        <YAxis stroke="#6b7280" fontSize={12} fontWeight="600" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area type="monotone" dataKey="submissions" fill="#4f46e5" stroke="#4f46e5" fillOpacity={0.2} strokeWidth={2} />
                                        <Bar dataKey="approved" fill="#10b981" radius={[6, 6, 0, 0]} stroke="#10b981" strokeWidth={2} />
                                        <Bar dataKey="rejected" fill="#ef4444" radius={[6, 6, 0, 0]} stroke="#ef4444" strokeWidth={2} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Engineers Tab */}
                    {activeTab === "engineers" && analyticsData.engineerStats.length > 0 && (
                        <div className="space-y-5">
                            <div className="pb-2">
                                <h3 className="text-2xl font-black text-gray-900">Engineer Performance Analytics</h3>
                                <p className="text-sm text-gray-600 mt-1 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full"></span>
                                    Individual engineer statistics and approval rates
                                </p>
                            </div>

                            {/* Engineer Stats Table */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Engineer</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Approved</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Rejected</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Pending</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Success Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analyticsData.engineerStats.map((item, index) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-pink-50/30 transition-colors duration-200">
                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.name}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 font-bold text-sm shadow-sm">
                                                            {item.total}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 font-bold text-sm shadow-sm">
                                                            {item.approved}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 text-red-700 font-bold text-sm shadow-sm">
                                                            {item.rejected}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 font-bold text-sm shadow-sm">
                                                            {item.pending}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-pink-400 to-rose-500 shadow-sm"
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

                            <div className="bg-gradient-to-br from-white via-pink-50/20 to-white rounded-2xl border border-pink-100 shadow-lg p-4">
                                <ResponsiveContainer width="100%" height={330}>
                                    <BarChart data={analyticsData.engineerStats} margin={{ top: 20, right: 30, left: 0, bottom: 100 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            fontWeight="600"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis stroke="#6b7280" fontSize={12} fontWeight="600" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="approved" fill="#10b981" radius={[6, 6, 0, 0]} stroke="#10b981" strokeWidth={2} />
                                        <Bar dataKey="rejected" fill="#ef4444" radius={[6, 6, 0, 0]} stroke="#ef4444" strokeWidth={2} />
                                        <Bar dataKey="pending" fill="#f59e0b" radius={[6, 6, 0, 0]} stroke="#f59e0b" strokeWidth={2} />
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