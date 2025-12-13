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
import { FaChartBar, FaArrowUp, FaCheckCircle, FaHourglass, FaChartLine, FaFireAlt, FaBolt, FaAward, FaCreditCard, FaBuilding, FaCity, FaCalendarAlt, FaUsers, FaStar } from "react-icons/fa";

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
            const isMultiSeries = payload.length > 1;
            return (
                <div className="bg-gradient-to-br from-white to-gray-50 p-4 border-2 border-gray-300 rounded-xl shadow-2xl backdrop-blur-md bg-opacity-98">
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-2">
                        {payload[0].payload.name || payload[0].name}
                    </p>
                    {isMultiSeries ? (
                        <div className="space-y-2">
                            {payload.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill || item.color }}></div>
                                    <span className="text-sm font-semibold text-gray-700">
                                        {item.name}: <span className="font-bold text-gray-900">{item.value}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-lg font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {payload[0].value}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Premium Stat Card Component
    const StatCard = ({ icon: Icon, label, value, color, trend }) => {
        const colorClasses = {
            blue: { bg: "from-blue-500 via-blue-400 to-blue-500", light: "from-blue-50 to-blue-100", border: "border-blue-300", text: "text-blue-700", icon: "text-blue-600" },
            green: { bg: "from-green-500 via-green-400 to-green-500", light: "from-green-50 to-green-100", border: "border-green-300", text: "text-green-700", icon: "text-green-600" },
            red: { bg: "from-red-500 via-red-400 to-red-500", light: "from-red-50 to-red-100", border: "border-red-300", text: "text-red-700", icon: "text-red-600" },
            purple: { bg: "from-purple-500 via-purple-400 to-purple-500", light: "from-purple-50 to-purple-100", border: "border-purple-300", text: "text-purple-700", icon: "text-purple-600" },
            amber: { bg: "from-amber-500 via-amber-400 to-amber-500", light: "from-amber-50 to-amber-100", border: "border-amber-300", text: "text-amber-700", icon: "text-amber-600" },
            indigo: { bg: "from-indigo-500 via-indigo-400 to-indigo-500", light: "from-indigo-50 to-indigo-100", border: "border-indigo-300", text: "text-indigo-700", icon: "text-indigo-600" },
            pink: { bg: "from-pink-500 via-pink-400 to-pink-500", light: "from-pink-50 to-pink-100", border: "border-pink-300", text: "text-pink-700", icon: "text-pink-600" },
        };

        const theme = colorClasses[color];

        return (
            <div className={`relative overflow-hidden rounded-2xl border-2 ${theme.border} shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-105`}>
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.light} opacity-90`}></div>

                {/* Floating accent */}
                <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${theme.bg} opacity-20 rounded-full blur-2xl group-hover:scale-110 transition-transform`}></div>

                <div className="relative z-10 p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${theme.text} uppercase tracking-widest`}>{label}</p>
                        <p className="text-3xl font-black text-gray-900 mt-2">{value}</p>
                        {trend && (
                            <p className={`text-xs font-semibold ${theme.text} mt-2 flex items-center gap-1`}>
                                <FaArrowUp className="text-green-600" />
                                {trend}
                            </p>
                        )}
                    </div>
                    <div className={`relative p-3 rounded-xl bg-gradient-to-br ${theme.bg} shadow-lg flex-shrink-0`}>
                        <Icon className={`text-2xl text-white`} />
                        <div className="absolute inset-0 rounded-xl border-2 border-white/20"></div>
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
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 h-full shadow-2xl">
            <CardContent className="p-0 h-full flex flex-col">
                {/* Premium Tab Navigation */}
                <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 overflow-x-auto flex gap-3 px-6 py-5 flex-shrink-0 border-b border-blue-500/30 shadow-lg">
                    {tabButtons.map((tab) => {
                        const tabColor = getTabColor(tab.color);
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2 group transform hover:scale-105 ${isActive
                                    ? `bg-gradient-to-r ${tabColor.bg} ${tabColor.text} shadow-2xl scale-105 border-2 border-white/40 hover:scale-110 backdrop-blur-sm`
                                    : "bg-white/8 text-white hover:bg-white/25 border-2 border-white/15 hover:border-white/30 backdrop-blur-sm"
                                    }`}
                            >
                                <tab.icon className={`text-lg transition-all group-hover:scale-125 duration-200 ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`} />
                                <span className="text-sm sm:text-base">{tab.label}</span>
                                {isActive && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-white rounded-full shadow-lg animate-pulse"></div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
                    {/* Status Tab */}
                    {activeTab === "status" && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <FaStar className="text-yellow-400 text-xl" />
                                    <h3 className="text-3xl font-black text-gray-900">Status Distribution</h3>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">Real-time overview of all submissions across different processing stages</p>
                            </div>

                            {/* Statistics Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

                            {/* Premium Chart Container */}
                            <div className="relative overflow-hidden rounded-3xl border border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-500 group bg-white">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-blue-50/60 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                                <div className="relative z-10 p-4">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                                        <div className="w-1.5 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full shadow-lg"></div>
                                        <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">Submission Status Breakdown</p>
                                    </div>
                                    <ResponsiveContainer width="100%" height={60}>
                                        <BarChart
                                            data={statusData}
                                            margin={{ top: 5, right: 20, left: 5, bottom: 15 }}
                                            layout="vertical"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                                            <XAxis type="number" stroke="#374151" fontSize={11} fontWeight="600" />
                                            <YAxis type="category" dataKey="name" stroke="#374151" fontSize={10} fontWeight="600" width={100} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />
                                            <Bar dataKey="value" radius={[0, 16, 16, 0]} animationDuration={1000} isAnimationActive={true}>
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.9} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Tab */}
                    {activeTab === "payment" && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <FaStar className="text-yellow-400 text-xl" />
                                    <h3 className="text-3xl font-black text-gray-900">Payment Collection Status</h3>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">Track payment collection metrics across all submissions</p>
                            </div>

                            {/* Payment Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                            {/* Premium Chart Container */}
                            <div className="relative overflow-hidden rounded-3xl border border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-500 group bg-white">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-transparent to-green-50/60 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                                <div className="relative z-10 p-4">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                                        <div className="w-1.5 h-6 bg-gradient-to-b from-green-600 to-green-400 rounded-full shadow-lg"></div>
                                        <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">Payment Collection Distribution</p>
                                    </div>
                                    <ResponsiveContainer width="100%" height={70}>
                                        <PieChart>
                                            <Pie
                                                data={paymentData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={({ name, value, percent }) =>
                                                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                                                }
                                                outerRadius={30}
                                                innerRadius={12}
                                                dataKey="value"
                                                animationDuration={1200}
                                                isAnimationActive={true}
                                            >
                                                {paymentData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.9} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Banks Tab */}
                    {activeTab === "banks" && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <FaStar className="text-yellow-400 text-xl" />
                                    <h3 className="text-3xl font-black text-gray-900">Top Banks Distribution</h3>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">Market share and submissions across banking partners</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Banks Summary Table */}
                                <div className="lg:col-span-1 rounded-3xl border border-gray-300 shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 group bg-white">
                                    <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 px-6 py-6 shadow-md group-hover:shadow-lg transition-shadow">
                                        <p className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-3">
                                            <FaBuilding className="text-lg" />
                                            Bank List
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto max-h-96 bg-white scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-100">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                                                    <th className="px-5 py-3 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Bank</th>
                                                    <th className="px-5 py-3 text-right text-xs font-bold text-purple-900 uppercase tracking-wider">Count</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bankData.map((item, index) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors group">
                                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-4 h-4 rounded-lg shadow-md group-hover:scale-110 transition-transform" style={{ backgroundColor: item.fill }}></div>
                                                                <span>{item.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-purple-100 text-purple-700 font-bold text-sm shadow-md">{item.value}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Banks Pie Chart */}
                                <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-500 group bg-white">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/60 via-transparent to-purple-50/60 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                                    <div className="relative z-10 p-4">
                                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                                            <div className="w-1.5 h-6 bg-gradient-to-b from-purple-600 to-purple-400 rounded-full shadow-lg"></div>
                                            <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">Market Share Distribution</p>
                                        </div>
                                        <ResponsiveContainer width="100%" height={70}>
                                            <PieChart>
                                                <Pie
                                                    data={bankData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={true}
                                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={30}
                                                    innerRadius={13}
                                                    dataKey="value"
                                                    animationDuration={1200}
                                                    isAnimationActive={true}
                                                >
                                                    {bankData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.9} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cities Tab */}
                    {activeTab === "cities" && cityData.length > 0 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <FaStar className="text-yellow-400 text-xl" />
                                    <h3 className="text-3xl font-black text-gray-900">Top Cities Distribution</h3>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">Submission volume analysis across top cities</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Cities Summary Table */}
                                <div className="lg:col-span-1 rounded-3xl border border-gray-300 shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 group bg-white">
                                    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-6 py-6 shadow-md group-hover:shadow-lg transition-shadow">
                                        <p className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-3">
                                            <FaCity className="text-lg" />
                                            City Rankings
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto max-h-96 bg-white scrollbar-thin scrollbar-thumb-amber-400 scrollbar-track-gray-100">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-amber-50 to-amber-100 border-b-2 border-amber-200">
                                                    <th className="px-5 py-3 text-left text-xs font-bold text-amber-900 uppercase tracking-wider">City</th>
                                                    <th className="px-5 py-3 text-right text-xs font-bold text-amber-900 uppercase tracking-wider">Count</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cityData.map((item, index) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-amber-50/50 transition-colors">
                                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                                            <div className="flex items-center gap-3">
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 text-amber-700 font-bold text-xs">{index + 1}</span>
                                                                {item.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 text-amber-700 font-bold text-sm shadow-md">{item.count}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Cities Bar Chart */}
                                <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-500 group bg-white">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-transparent to-amber-50/60 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                                    <div className="relative z-10 p-4">
                                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                                            <div className="w-1.5 h-6 bg-gradient-to-b from-amber-600 to-amber-400 rounded-full shadow-lg"></div>
                                            <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">City-wise Submission Volume</p>
                                        </div>
                                        <ResponsiveContainer width="100%" height={65}>
                                            <BarChart data={cityData} margin={{ top: 5, right: 20, left: 10, bottom: 35 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" horizontal={true} vertical={false} />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="#b45309"
                                                    fontSize={9}
                                                    fontWeight="600"
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={35}
                                                />
                                                <YAxis stroke="#b45309" fontSize={11} fontWeight="600" />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(251, 146, 60, 0.15)" }} />
                                                <Bar dataKey="count" fill="#f59e0b" radius={[12, 12, 0, 0]} animationDuration={1000} isAnimationActive={true} opacity={0.9} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timeline Tab */}
                    {activeTab === "timeline" && analyticsData.monthlyData.length > 0 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <FaStar className="text-yellow-400 text-xl" />
                                    <h3 className="text-3xl font-black text-gray-900">Submission Timeline & Trends</h3>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">Monthly submission volume and approval patterns</p>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard
                                    icon={FaBolt}
                                    label="Total"
                                    value={files.length}
                                    color="indigo"
                                    trend="All submissions"
                                />
                                <StatCard
                                    icon={FaCheckCircle}
                                    label="Approved"
                                    value={files.filter(f => f.status === "approved").length}
                                    color="green"
                                    trend="Success"
                                />
                                <StatCard
                                    icon={FaFireAlt}
                                    label="Rejected"
                                    value={files.filter(f => f.status === "rejected").length}
                                    color="red"
                                    trend="Issues"
                                />
                                <StatCard
                                    icon={FaAward}
                                    label="Success Rate"
                                    value={`${files.length > 0 ? ((files.filter(f => f.status === "approved").length / files.length) * 100).toFixed(0) : 0}%`}
                                    color="purple"
                                    trend="Performance"
                                />
                            </div>

                            {/* Premium Chart Container */}
                            <div className="relative overflow-hidden rounded-3xl border border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-500 group bg-white">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-transparent to-indigo-50/60 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                                <div className="relative z-10 p-4">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                                        <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full shadow-lg"></div>
                                        <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">Monthly Submission Trends</p>
                                    </div>
                                    <ResponsiveContainer width="100%" height={70}>
                                        <ComposedChart data={analyticsData.monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" horizontal={true} vertical={false} />
                                            <XAxis dataKey="name" stroke="#312e81" fontSize={9} fontWeight="600" />
                                            <YAxis stroke="#312e81" fontSize={9} fontWeight="600" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px" }} />
                                            <Area type="monotone" dataKey="submissions" fill="#4f46e5" stroke="#4f46e5" fillOpacity={0.2} strokeWidth={2} isAnimationActive={true} animationDuration={1000} />
                                            <Bar dataKey="approved" fill="#10b981" radius={[8, 8, 0, 0]} animationDuration={1000} isAnimationActive={true} opacity={0.9} />
                                            <Bar dataKey="rejected" fill="#ef4444" radius={[8, 8, 0, 0]} animationDuration={1000} isAnimationActive={true} opacity={0.9} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Engineers Tab */}
                    {activeTab === "engineers" && analyticsData.engineerStats.length > 0 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <FaStar className="text-yellow-400 text-xl" />
                                    <h3 className="text-3xl font-black text-gray-900">Engineer Performance Analytics</h3>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">Individual engineer statistics and approval metrics</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* Engineer Stats Table */}
                                <div className="lg:col-span-2 rounded-3xl border border-gray-300 shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 group bg-white">
                                    <div className="bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 px-6 py-6 shadow-md group-hover:shadow-lg transition-shadow">
                                        <p className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-3">
                                            <FaUsers className="text-lg" />
                                            Engineer Metrics
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto max-h-96 bg-white scrollbar-thin scrollbar-thumb-pink-400 scrollbar-track-gray-100">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-pink-50 to-pink-100 border-b-2 border-pink-200">
                                                    <th className="px-5 py-3 text-left text-xs font-bold text-pink-900 uppercase tracking-wider">Engineer</th>
                                                    <th className="px-5 py-3 text-center text-xs font-bold text-pink-900 uppercase tracking-wider">Stats</th>
                                                    <th className="px-5 py-3 text-right text-xs font-bold text-pink-900 uppercase tracking-wider">Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analyticsData.engineerStats.map((item, index) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-pink-50/50 transition-colors">
                                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">{item.name}</td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-green-200 to-green-100 text-green-700 font-bold text-xs" title="Approved">{item.approved}</span>
                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-red-200 to-red-100 text-red-700 font-bold text-xs" title="Rejected">{item.rejected}</span>
                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 text-amber-700 font-bold text-xs" title="Pending">{item.pending}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-pink-200 to-pink-100 text-pink-700 font-bold text-xs shadow-md">{item.approvalRate}%</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Engineer Stats Bar Chart */}
                                <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-500 group bg-white">
                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-transparent to-pink-50/60 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                                    <div className="relative z-10 p-4">
                                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                                            <div className="w-1.5 h-6 bg-gradient-to-b from-pink-600 to-pink-400 rounded-full shadow-lg"></div>
                                            <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">Performance Distribution</p>
                                        </div>
                                        <ResponsiveContainer width="100%" height={70}>
                                            <BarChart data={analyticsData.engineerStats} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#fbcfe8" horizontal={true} vertical={false} />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="#be185d"
                                                    fontSize={9}
                                                    fontWeight="600"
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={50}
                                                />
                                                <YAxis stroke="#be185d" fontSize={9} fontWeight="600" />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                                                <Bar dataKey="approved" fill="#10b981" radius={[8, 8, 0, 0]} animationDuration={1000} isAnimationActive={true} opacity={0.9} />
                                                <Bar dataKey="rejected" fill="#ef4444" radius={[8, 8, 0, 0]} animationDuration={1000} isAnimationActive={true} opacity={0.9} />
                                                <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} animationDuration={1000} isAnimationActive={true} opacity={0.9} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default StatusGraph;
