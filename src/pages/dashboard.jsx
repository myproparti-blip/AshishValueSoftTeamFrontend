import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaComments, FaTimes } from "react-icons/fa";
import { FaSignOutAlt, FaPlus, FaDownload, FaSyncAlt, FaEye, FaSort, FaChartBar, FaLock, FaClock, FaSpinner, FaCheckCircle, FaTimesCircle, FaEdit, FaFileAlt, FaCreditCard, FaRedo } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui";
import { getAllValuations, requestRework } from "../services/ubiShopService";
import { getAllBofMaharashtra, requestReworkBofMaharashtra } from "../services/bomFlatService";
import { getAllUbiApfForms, requestReworkUbiApfForm } from "../services/ubiApfService";
import { logoutUser } from "../services/auth";
import { showLoader, hideLoader } from "../redux/slices/loaderSlice";
import { setCurrentPage, setTotalItems } from "../redux/slices/paginationSlice";
import { invalidateCache } from "../services/axios";
import { useNotification } from "../context/NotificationContext";
import Pagination from "../components/Pagination";
import LoginModal from "../components/LoginModal";
import SearchBar from "../components/SearchBar";
import ReworkModal from "../components/ReworkModal";
import StatusGraph from "../components/StatusGraph";
import { getFormRouteForBank, isBofMaharashtraBank } from "../config/bankFormMapping";
import { streamAIResponse } from "../services/aiService";

const DashboardPage = ({ user, onLogout, onLogin }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { showSuccess } = useNotification();
    const { currentPage, itemsPerPage, totalItems } = useSelector((state) => state.pagination);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [timeDurations, setTimeDurations] = useState({});
    const [statusFilter, setStatusFilter] = useState(null);
    const [cityFilter, setCityFilter] = useState(null);
    const [bankFilter, setBankFilter] = useState(null);
    const [engineerFilter, setEngineerFilter] = useState(null);
    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [copiedRows, setCopiedRows] = useState(new Map()); // Map<id, rowData>
    const [reworkModalOpen, setReworkModalOpen] = useState(false);
    const [reworkingRecordId, setReworkingRecordId] = useState(null);
    const [reworkingRecord, setReworkingRecord] = useState(null);
    const [reworkLoading, setReworkLoading] = useState(false);
    const username = user?.username || "";
    const role = user?.role || "";
    const clientId = user?.clientId || "";
    const isLoggedIn = !!user;
    const pollIntervalRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const isMountedRef = useRef(false);
    const { showError } = useNotification();
    const [showChat, setShowChat] = useState(false);
const [messages, setMessages] = useState([]);
const [input, setInput] = useState("");
let aiStreamRef = useRef(null);


    // Helper function to normalize status values - trim and validate
    const normalizeStatus = (status) => {
        const normalized = String(status || "").trim().toLowerCase();
        const validStatuses = ["pending", "on-progress", "approved", "rejected", "rework"];
        return validStatuses.includes(normalized) ? normalized : null;
    };

    // Helper function to navigate to the correct form based on selectedForm or bank name
    const navigateToEditForm = (record) => {
        console.log("🔵 navigateToEditForm called");
        console.log("📊 Record data:", record);
        console.log("🏦 bankName value:", record?.bankName);
        console.log("📋 selectedForm value:", record?.selectedForm);
        console.log("🆔 uniqueId value:", record?.uniqueId);

        let formRoute;

        // First priority: use selectedForm if explicitly set
        if (record?.selectedForm === 'bomFlat') {
            // BOM Flat form route
            formRoute = "/valuationeditformbomaharastra";
            console.log("✅ Routing based on selectedForm='bomFlat'");
        } else if (record?.selectedForm === 'ubiShop') {
            // UBI Shop form route
            formRoute = "/valuationeditform";
            console.log("✅ Routing based on selectedForm='ubiShop'");
        } else if (record?.selectedForm === 'ubiApf') {
            // UBI APF form route
            formRoute = "/valuationeditformubiapf";
            console.log("✅ Routing based on selectedForm='ubiApf'");
        } else {
            // If no selectedForm, use bank-based routing
            // Check if bank is BOM first, then use getFormRouteForBank
            if (isBofMaharashtraBank(record?.bankName)) {
                formRoute = "/valuationeditformbomaharastra";
                console.log("✅ Routing based on isBofMaharashtraBank check");
            } else {
                formRoute = getFormRouteForBank(record?.bankName);
                console.log("✅ Routing based on getFormRouteForBank");
            }
        }
        
        console.log("✅ Final route:", formRoute, "for record:", record?.selectedForm || record?.bankName);
        navigate(`${formRoute}/${record.uniqueId}`);
    };
    // Handle sorting
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
        dispatch(setCurrentPage(1));
    };
const handleSendMessage = (e) => {
  e.preventDefault();

  const userMessage = { sender: "user", text: input };
  setMessages((prev) => [...prev, userMessage]);

  const aiMessage = { sender: "ai", text: "" };
  setMessages((prev) => [...prev, aiMessage]);

  const index = messages.length;

  aiStreamRef.current = streamAIResponse(
    input,
    (token) => {
      setMessages((prev) => {
        const updated = [...prev];
        updated[index] = {
          sender: "ai",
          text: updated[index].text + token,
        };
        return updated;
      });
    },
    () => console.log("AI Complete"),
    (err) => console.log("AI Error", err)
  );

  setInput("");
};

useEffect(() => {
  const box = document.getElementById("aiChatBox");
  if (box) box.scrollTop = box.scrollHeight;
}, [messages]);

    // Filter files based on status, city, bank, and engineer filters
    const filteredFiles = files.filter(f => {
        if (statusFilter && normalizeStatus(f.status) !== statusFilter) return false;
        if (cityFilter && f.city !== cityFilter) return false;
        if (bankFilter && f.bankName !== bankFilter) return false;
        if (engineerFilter && f.engineerName !== engineerFilter) return false;
        return true;
    });

    // Sort filtered files
    const sortedFiles = [...filteredFiles].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle duration sorting
        if (sortField === "duration") {
            const aDuration = timeDurations[a._id];
            const bDuration = timeDurations[b._id];

            const aSeconds = aDuration ? (aDuration.days * 86400 + aDuration.hours * 3600 + aDuration.minutes * 60 + aDuration.seconds) : 0;
            const bSeconds = bDuration ? (bDuration.days * 86400 + bDuration.hours * 3600 + bDuration.minutes * 60 + bDuration.seconds) : 0;

            return sortOrder === "asc" ? aSeconds - bSeconds : bSeconds - aSeconds;
        }

        // Handle date sorting
        if (sortField === "createdAt" || sortField === "dateTime") {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
        }

        // Handle string sorting
        if (typeof aVal === "string") {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
            return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        // Handle numeric sorting 
        if (sortOrder === "asc") {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    // Calculate pagination
    const totalPages = Math.ceil(sortedFiles.length / itemsPerPage);
    const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFiles = sortedFiles.slice(startIndex, endIndex);

    const calculateTimeDurations = (filesList) => {
        const durations = {};
        filesList.forEach(record => {
            const normalizedStatus = normalizeStatus(record.status);
            if (normalizedStatus === "pending" || normalizedStatus === "on-progress" || normalizedStatus === "rejected" || normalizedStatus === "rework") {
                const createdTime = new Date(record.createdAt).getTime();
                const now = new Date().getTime();
                const diffMs = now - createdTime;
                const diffSecs = Math.floor(diffMs / 1000);
                const diffMins = Math.floor(diffSecs / 60);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);

                durations[record._id] = {
                    days: diffDays,
                    hours: diffHours % 24,
                    minutes: diffMins % 60,
                    seconds: diffSecs % 60
                };
            }
        });
        setTimeDurations(durations);
    };

    // Get unique values for dropdown filters
    const uniqueCities = [...new Set(files.map(f => f.city).filter(c => c && c.trim()))].sort();
    const uniqueBanks = [...new Set(files.map(f => f.bankName).filter(b => b && b.trim()))].sort();
    const uniqueEngineers = [...new Set(files.map(f => f.engineerName).filter(e => e && e.trim()))].sort();


    // Reset to page 1 when filter changes
    useEffect(() => {
        dispatch(setCurrentPage(1));
    }, [statusFilter, cityFilter, bankFilter, engineerFilter, dispatch]);

    // Handle logout - clear files when user logs out
    useEffect(() => {
        if (!isLoggedIn) {
            setFiles([]);
            setTimeDurations({});
            setStatusFilter(null);
            setCityFilter(null);
            setBankFilter(null);
            setEngineerFilter(null);
            setSortField("createdAt");
            setSortOrder("desc");
            setSelectedRows(new Set());
            setCopiedRows(new Map());
            dispatch(setTotalItems(0));
            dispatch(setCurrentPage(1));
        }
    }, [isLoggedIn, dispatch]);

    // Handle login - refetch files when user logs in
    useEffect(() => {
        if (isLoggedIn && isMountedRef.current) {
            // Refetch when user logs in
            invalidateCache("/valuations");
            dispatch(showLoader("Loading Data..."));
            fetchFiles(true);
        } else if (!isMountedRef.current && isLoggedIn) {
            // Initial mount with logged in user
            isMountedRef.current = true;
            invalidateCache("/valuations");
            dispatch(showLoader("Loading Data..."));
            fetchFiles(true);
        }
    }, [isLoggedIn, dispatch]);

    useEffect(() => {
        // Duration update interval - update every second for real-time display
        const durationInterval = setInterval(() => {
            calculateTimeDurations(files);
        }, 1000); // Update durations every second

        return () => {
            clearInterval(durationInterval);
        };
    }, [files]);

    const fetchFiles = async (isInitial = false, showLoadingIndicator = true) => {
        try {
            if (!isInitial && showLoadingIndicator) {
                setLoading(true);
                dispatch(showLoader("Loading Data..."));
            }
            // Invalidate cache before fetching to ensure fresh data
            invalidateCache("/valuations");
            invalidateCache("/bof-maharashtra");
            invalidateCache("/ubi-apf");
            
            // Fetch from all three endpoints in parallel
            const [valuationsResponse, bofResponse, ubiApfResponse] = await Promise.all([
                getAllValuations({ username, userRole: role, clientId }).catch(() => ({ data: [] })),
                getAllBofMaharashtra({ username, userRole: role, clientId }).catch(() => ({ data: [] })),
                getAllUbiApfForms({ username, userRole: role, clientId }).catch(() => ({ data: [] }))
            ]);
            
            // Combine responses with formType markers
            const valuationsData = (Array.isArray(valuationsResponse?.data) ? valuationsResponse.data : [])
                .map(item => ({ ...item, formType: 'ubiShop' }));
            const bofData = (Array.isArray(bofResponse?.data) ? bofResponse.data : [])
                .map(item => ({ ...item, formType: 'bomFlat' }));
            const ubiApfData = (Array.isArray(ubiApfResponse?.data) ? ubiApfResponse.data : [])
                .map(item => ({ ...item, formType: 'ubiApf' }));
            
            const response = {
                ...valuationsResponse,
                data: [...valuationsData, ...bofData, ...ubiApfData]
            };
            // Handle response format: API returns { success, data: [...], pagination: {...} }
            let filesList = [];
            if (Array.isArray(response)) {
                // Direct array response
                filesList = response;
            } else if (Array.isArray(response?.data)) {
                // Nested array in data property
                filesList = response.data;
            } else if (response?.data && Array.isArray(response.data.data)) {
                // Double nested (edge case)
                filesList = response.data.data;
            } else {
                // Fallback
                filesList = [];
            }
            // DEDUPLICATION: Remove duplicates by uniqueId, keeping the NEWEST version
            const uniqueByUniqueIdMap = new Map(); // Map<uniqueId, item>
            const deduplicatedList = [];
            filesList.forEach(item => {
                if (!item.uniqueId) {
                    // No uniqueId, keep it
                    deduplicatedList.push(item);
                    return;
                }

                const existing = uniqueByUniqueIdMap.get(item.uniqueId);
                if (!existing) {
                    // First time seeing this uniqueId
                    uniqueByUniqueIdMap.set(item.uniqueId, item);
                    deduplicatedList.push(item);
                } else {
                    // Duplicate found - keep the one with the latest lastUpdatedAt
                    const existingTime = new Date(existing.lastUpdatedAt || existing.updatedAt || existing.createdAt).getTime();
                    const currentTime = new Date(item.lastUpdatedAt || item.updatedAt || item.createdAt).getTime();
                    
                    if (currentTime > existingTime) {
                        // Current item is newer - replace the old one
                        const existingIndex = deduplicatedList.findIndex(d => d.uniqueId === item.uniqueId);
                        deduplicatedList[existingIndex] = item;
                        uniqueByUniqueIdMap.set(item.uniqueId, item);
                        console.warn(`⚠️ Dashboard - Duplicate detected for uniqueId "${item.uniqueId}": Kept newer version (updated at ${item.lastUpdatedAt})`);
                    } else {
                        console.warn(`⚠️ Dashboard - Duplicate detected for uniqueId "${item.uniqueId}": Kept existing version`);
                    }
                }
            });

            filesList = deduplicatedList;
            console.log("📥 Dashboard - Fetched valuations from API:", filesList);
            console.log(`🎯 Deduplication: Removed ${response?.data?.length - filesList.length} duplicates`);
            console.log("🏦 Bank names in data:", filesList.map(f => ({ id: f._id, bankName: f.bankName, uniqueId: f.uniqueId })));

            // Debug status values - DETAILED
            const statusBreakdown = filesList.reduce((acc, f) => {
                const normalized = normalizeStatus(f.status);
                const raw = f.status;
                const rawBytes = raw ? `[${String(raw).split('').map(c => c.charCodeAt(0)).join(',')}]` : 'null';
                acc[`"${raw}" (bytes: ${rawBytes}, normalized: ${normalized})`] = (acc[`"${raw}" (bytes: ${rawBytes}, normalized: ${normalized})`] || 0) + 1;
                return acc;
            }, {});

            console.log("📊 Detailed Status Distribution:", statusBreakdown);
            console.log("📊 Sample records with status:", filesList.slice(0, 3).map(f => ({ 
                id: f._id, 
                rawStatus: f.status, 
                statusType: typeof f.status,
                statusLength: String(f.status || '').length,
                normalized: normalizeStatus(f.status) 
            })));
            console.log("📊 Status counts:", {
                pending: filesList.filter(f => normalizeStatus(f.status) === "pending").length,
                "on-progress": filesList.filter(f => normalizeStatus(f.status) === "on-progress").length,
                approved: filesList.filter(f => normalizeStatus(f.status) === "approved").length,
                rejected: filesList.filter(f => normalizeStatus(f.status) === "rejected").length,
                rework: filesList.filter(f => normalizeStatus(f.status) === "rework").length,
                total: filesList.length
            });
            setFiles(filesList);
            dispatch(setTotalItems(filesList.length));
            if (isInitial) {
                dispatch(setCurrentPage(1));
            }
            calculateTimeDurations(filesList);
        } catch (err) {
            console.error("❌ Dashboard - Error fetching valuations:", err);
            // Error fetching valuations
        } finally {
            if (showLoadingIndicator) {
                setLoading(false);
                dispatch(hideLoader());
            }
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        dispatch(showLoader("Loading Data..."));
        try {
            await logoutUser();
            // Clear files immediately
            setFiles([]);
            setTimeDurations({});
            if (onLogout) onLogout();
            setTimeout(() => {
                dispatch(hideLoader());
                navigate("/dashboard");
            }, 500);
        } catch (error) {
            // Clear files even on error
            setFiles([]);
            setTimeDurations({});
            if (onLogout) onLogout();
            dispatch(hideLoader());
            navigate("/dashboard");
        } finally {
            setLoggingOut(false);
            setLogoutModalOpen(false);
        }
    };

    const getStatusBadge = (status) => {
        const normalized = normalizeStatus(status);
        const variants = {
            "pending": { variant: "warning", label: "PR", fullLabel: "Pending Review" },
            "on-progress": { variant: "default", label: "OP", fullLabel: "On Progress" },
            "approved": { variant: "success", label: "App", fullLabel: "Approved" },
            "rejected": { variant: "destructive", label: "Rej", fullLabel: "Rejected" },
            "rework": { variant: "outline", label: "RW", fullLabel: "Rework" },
        };
        const config = variants[normalized] || variants["pending"];
        return <Badge variant={config.variant} title={config.fullLabel}>{config.label}</Badge>;
    };

    const getPaymentBadge = (payment) => {
        return (
            <Badge variant={payment === "yes" ? "success" : "warning"}>
                {payment === "yes" ? "Collected" : "Not Collected"}
            </Badge>
        );
    };

    const handleDownloadPDF = async (record) => {
        try {
            dispatch(showLoader("Generating PDF..."));
            
            // Determine which PDF service to use based on form type
            if (record?.formType === 'bomFlat') {
                const { generateRecordPDF } = await import("../services/bomFlatPdf.js");
                await generateRecordPDF(record);
            } else {
                // Default to UBI Shop for ubiShop, ubiApf, or undefined
                const { generateRecordPDF } = await import("../services/ubiShopPdf.js");
                await generateRecordPDF(record);
            }
            
            showSuccess("PDF downloaded successfully!");
            dispatch(hideLoader());
        } catch (error) {
            console.error("Download error:", error);
            showError(error.message || "Failed to download PDF");
            dispatch(hideLoader());
        }
    };

    const handleDownloadDOCX = async (record) => {
        try {
            dispatch(showLoader("Generating Word document..."));
            
            // Determine which DOCX service to use based on form type
            if (record?.formType === 'bomFlat') {
                const { generateRecordDOCX } = await import("../services/bomFlatPdf.js");
                await generateRecordDOCX(record);
            } else {
                // Default to UBI Shop for ubiShop, ubiApf, or undefined
                const { generateRecordDOCX } = await import("../services/ubiShopPdf.js");
                await generateRecordDOCX(record);
            }
            
            showSuccess("Word document downloaded successfully!");
            dispatch(hideLoader());
        } catch (error) {
            console.error("Download error:", error);
            showError(error.message || "Failed to download Word document");
            dispatch(hideLoader());
        }
    };

    const handleReworkRequest = (record) => {
        console.log("[handleReworkRequest] Received record:", {
            uniqueId: record.uniqueId,
            bankName: record.bankName,
            status: record.status,
            recordKeys: Object.keys(record)
        });
        setReworkingRecordId(record.uniqueId);
        setReworkingRecord(record);
        setReworkModalOpen(true);
    };

    const handleReworkSubmit = async (reworkComments) => {
        try {
            setReworkLoading(true);
            dispatch(showLoader("Requesting rework..."));
            
            console.log("[handleReworkSubmit] Record info:", { 
                recordId: reworkingRecordId,
                formType: reworkingRecord?.formType
            });
            
            // Call the correct service based on form type
            if (reworkingRecord?.formType === 'bomFlat') {
                console.log("[handleReworkSubmit] Calling requestReworkBofMaharashtra");
                await requestReworkBofMaharashtra(reworkingRecordId, reworkComments, username, role);
                invalidateCache("bof-maharashtra");
            } else if (reworkingRecord?.formType === 'ubiApf') {
                console.log("[handleReworkSubmit] Calling requestReworkUbiApfForm");
                await requestReworkUbiApfForm(reworkingRecordId, reworkComments, username, role);
                invalidateCache("ubi-apf");
            } else {
                console.log("[handleReworkSubmit] Calling requestRework (UbiShop)");
                await requestRework(reworkingRecordId, reworkComments, username, role);
                invalidateCache("/valuations");
            }
            
            showSuccess("Rework requested successfully!");
            setReworkModalOpen(false);
            setReworkingRecordId(null);
            setReworkingRecord(null);
            // Invalidate cache and fetch fresh data to update status counts
            await fetchFiles(false, false); // Avoid double loader
            // Force re-render to update status cards
            dispatch(hideLoader());
        } catch (error) {
            showError(error.message || "Failed to request rework");
            dispatch(hideLoader());
        } finally {
            setReworkLoading(false);
        }
    };
    // Bulletproof checkbox → copy logic with atomic state management
    const handleCheckboxChange = (recordId) => {
        setSelectedRows(prev => {
            const newSelected = new Set(prev);
            let isAdding = false;

            if (newSelected.has(recordId)) {
                // UNCHECKING: delete and remove from copied data
                newSelected.delete(recordId);
            } else {
                // CHECKING: add and copy row data
                newSelected.add(recordId);
                isAdding = true;
            }

            // ATOMIC UPDATE: modify copiedRows in sync with selectedRows
            setCopiedRows(prevCopied => {
                const newCopied = new Map(prevCopied);

                if (isAdding) {
                    // Find the row data from authoritative source (files) at moment of state update
                    const rowData = files.find(f => f._id === recordId);
                    if (rowData) {
                        newCopied.set(recordId, rowData);
                    }
                } else {
                    // Remove copied data immediately when unchecking
                    newCopied.delete(recordId);
                }

                return newCopied;
            });

            return newSelected;
        });
    };

    const handleCopyToClipboard = (records) => {
        if (!Array.isArray(records) || records.length === 0) return;

        const textToCopy = records.map(record =>
            `Client Name: ${record.clientName}\nPhone Number: ${record.mobileNumber}\nBank Name: ${record.bankName}\nClient Address: ${record.address}`
        ).join("\n\n---\n\n");

        navigator.clipboard.writeText(textToCopy).then(() => {
            showSuccess(`${records.length} record(s) copied!`);
        }).catch(() => {
            showSuccess("Failed to copy");
        });
    };

    // Recalculate status counts when files change
    const pendingCount = files.filter(f => normalizeStatus(f.status) === "pending").length;
    const onProgressCount = files.filter(f => normalizeStatus(f.status) === "on-progress").length;
    const approvedCount = files.filter(f => normalizeStatus(f.status) === "approved").length;
    const rejectedCount = files.filter(f => normalizeStatus(f.status) === "rejected").length;
    const reworkCount = files.filter(f => normalizeStatus(f.status) === "rework").length;
    const totalCount = files.length;
    const completionRate = totalCount > 0 ? Math.round(((approvedCount + rejectedCount) / totalCount) * 100) : 0;

    // Force re-render on status updates
    useEffect(() => {
        // Debug: Log status counts whenever files change
        console.log("📊 Status Counts Updated:", {
            pending: pendingCount,
            "on-progress": onProgressCount,
            approved: approvedCount,
            rejected: rejectedCount,
            rework: reworkCount,
            total: totalCount,
            completionRate: `${completionRate}%`
        });
    }, [pendingCount, onProgressCount, approvedCount, rejectedCount, reworkCount, totalCount, completionRate]);

    // Refetch data when window regains focus (user returns from form)
    useEffect(() => {
        const handleWindowFocus = () => {
            console.log("🔄 Dashboard - Window regained focus, refetching data...");
            invalidateCache("/valuations");
            // Use setTimeout to ensure state is ready
            setTimeout(() => fetchFiles(true, true), 100);
        };

        window.addEventListener("focus", handleWindowFocus);

        return () => {
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, [isLoggedIn]);

    const StatCard = ({ title, value, color, status, icon: Icon }) => (
        <Card
            onClick={() => status && setStatusFilter(statusFilter === status ? null : status)}
            className={`overflow-hidden hover:shadow-premium-lg transition-all duration-300 ${status ? 'cursor-pointer' : 'cursor-default'} border-l-4 relative group ${status && statusFilter === status ? `ring-2 ring-neutral-300 shadow-premium-lg scale-105` : 'border-l-neutral-300 hover:border-l-neutral-400'}`}
        >
            <div className={`h-1.5 sm:h-2 bg-gradient-to-r ${color} group-hover:h-2.5 transition-all duration-300`}></div>
            <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-neutral-600 mb-2 sm:mb-3 truncate uppercase tracking-widest">{title}</p>
                        <p className={`text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                    </div>
                    {Icon && <Icon className={`h-8 w-8 sm:h-10 sm:w-10 opacity-15 flex-shrink-0 group-hover:opacity-30 transition-opacity`} />}
                </div>
                <div className={`mt-4 h-1 bg-gradient-to-r ${color} rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-300`}></div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <header className="bg-white text-neutral-900 shadow-premium-sm sticky top-0 z-40 border-b border-neutral-200">
                <div className="px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-3 sm:gap-4">
                    {/* Top Row - Logo, Search, and Controls */}
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <div className="text-2xl sm:text-3xl flex-shrink-0 text-blue-600 transform hover:scale-110 transition-transform duration-300">
                                <FaChartBar />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-black tracking-tight text-neutral-900 whitespace-nowrap">Valuation Dashboard</h1>
                                <p className="text-xs text-neutral-500 font-semibold mt-0.5 hidden sm:block">
                                    {!isLoggedIn ? "Read-Only Mode" : role === "user" ? "Manage Your Submissions" : role === "manager" ? "Review User Submissions" : "System Administrator"}
                                </p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 mx-3">
                            <SearchBar data={files} />
                        </div>

                        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                            <button
                                onClick={() => navigate("/valuationform")}
                                className="bg-blue-600 text-white hover:bg-blue-700 h-9 w-9 sm:h-10 sm:w-10 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 inline-flex items-center justify-center flex-shrink-0 rounded-lg border border-blue-700"
                                title="New Form"
                            >
                                <FaPlus style={{ fontSize: "16px" }} />
                            </button>
                           {role !== "user" && (
    <button
        onClick={() => navigate("/bills")}
        className="bg-blue-600 text-white hover:bg-blue-700 h-9 w-9 sm:h-10 sm:w-10 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 inline-flex items-center justify-center flex-shrink-0 rounded-lg border border-blue-700"
        title="Bills"
    >
        <FaCreditCard style={{ fontSize: "16px" }} />
    </button>
)}

                            <div className="h-8 sm:h-10 w-px bg-neutral-200"></div>

                            {!isLoggedIn ? (
                                <Button
                                    onClick={() => setLoginModalOpen(true)}
                                    className="bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm px-3 sm:px-5 h-9 sm:h-10 flex items-center gap-2 font-bold shadow-premium-sm hover:shadow-premium-md transition-all duration-300 border border-blue-700"
                                    title="Login"
                                >
                                    <FaLock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Login</span>
                                </Button>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 sm:gap-3 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-150 transition-all duration-300">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-white shadow-premium-sm border border-blue-700">
                                            <span className="text-xs sm:text-sm font-black">{username[0]?.toUpperCase()}</span>
                                        </div>
                                        <div className="hidden sm:block min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold truncate text-neutral-900">{username}</p>
                                            <p className="text-xs text-neutral-500 uppercase tracking-wider truncate font-medium">{role}</p>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 h-9 w-9 sm:h-10 sm:w-10 transition-all duration-300 hover:shadow-premium-md rounded-lg"
                                        onClick={() => setLogoutModalOpen(true)}
                                        title="Logout"
                                    >
                                        <FaSignOutAlt className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
                    <StatCard
                        title="Pending"
                        value={pendingCount}
                        color="from-amber-600 to-amber-700"
                        status="pending"
                        icon={FaClock}
                    />
                    <StatCard
                        title="In Progress"
                        value={onProgressCount}
                        color="from-blue-600 to-blue-700"
                        status="on-progress"
                        icon={FaSpinner}
                    />
                    <StatCard
                        title="Approved"
                        value={approvedCount}
                        color="from-green-600 to-green-700"
                        status="approved"
                        icon={FaCheckCircle}
                    />
                    <StatCard
                        title="Rejected"
                        value={rejectedCount}
                        color="from-red-600 to-red-700"
                        status="rejected"
                        icon={FaTimesCircle}
                    />
                    <StatCard
                        title="Rework"
                        value={reworkCount}
                        color="from-violet-600 to-violet-700"
                        status="rework"
                        icon={FaRedo}
                    />
                    <StatCard
                        title="Completion"
                        value={`${completionRate}%`}
                        color="from-indigo-600 to-indigo-700"
                        status={null}
                        icon={FaCheckCircle}
                    />
                </div>



                {/* Analytics Graphs */}
                {files.length > 0 && (
                    <div className="mt-8 sm:mt-10">
                        <StatusGraph files={files} isCompact={false} />
                    </div>
                )}

                {/* Data Table */}
                <Card className="overflow-hidden shadow-premium-lg hover:shadow-premium-xl transition-all duration-300 border-t-4 border-t-blue-600">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-neutral-100 border-b border-neutral-300 py-4 sm:py-5">
                        <div>
                            <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-3 text-neutral-900">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FaEye className="text-blue-600 text-lg" />
                                </div>
                                Valuation Forms
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm mt-2 text-neutral-600 font-semibold">{sortedFiles.length} records {statusFilter && `filtered`}</CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(statusFilter || cityFilter || bankFilter || engineerFilter) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setStatusFilter(null);
                                        setCityFilter(null);
                                        setBankFilter(null);
                                        setEngineerFilter(null);
                                    }}
                                    className="text-xs sm:text-sm px-3 sm:px-4 font-bold border-2 border-neutral-300 text-neutral-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 shadow-premium-sm hover:shadow-premium-md"
                                >
                                    Clear Filters
                                </Button>
                            )}
                            {selectedRows.size > 0 && (
                                <>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                            const selectedRecords = files.filter(r => selectedRows.has(r._id));
                                            if (selectedRecords.length > 0) {
                                                handleCopyToClipboard(selectedRecords);
                                            }
                                        }}
                                        className="text-xs sm:text-sm px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border border-blue-700"
                                    >
                                        Copy {selectedRows.size}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedRows(new Set())}
                                        className="text-xs sm:text-sm px-3 sm:px-4 font-bold border-2 border-neutral-300 text-neutral-700 hover:border-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 shadow-premium-sm hover:shadow-premium-md"
                                    >
                                        Clear Selection
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchFiles(false, true)}
                                disabled={loading}
                                className="text-xs sm:text-sm px-3 sm:px-4 font-bold border-2 border-neutral-300 text-neutral-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 shadow-premium-sm hover:shadow-premium-md disabled:opacity-50 disabled:border-neutral-300 disabled:text-neutral-400"
                            >
                                <FaSyncAlt className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {paginatedFiles.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent bg-neutral-200 border-b-2 border-neutral-400">
                                                <TableHead className="min-w-[35px] text-xs sm:text-sm px-1 font-black text-neutral-900">
                                                    <div className="flex items-center gap-1 justify-center text-lg">✓</div>
                                                </TableHead>
                                                <TableHead className="min-w-[65px] text-xs sm:text-sm cursor-pointer hover:bg-neutral-300 px-1 font-black text-neutral-900 transition-colors duration-200" onClick={() => handleSort("clientName")}>
                                                    <div className="flex items-center gap-1">Clnt {sortField === "clientName" && <FaSort className="h-3 w-3 text-neutral-800" />}</div>
                                                </TableHead>
                                                <TableHead className="min-w-[70px] text-xs sm:text-sm cursor-pointer hover:bg-neutral-300 px-1 font-black text-neutral-900 transition-colors duration-200" onClick={() => handleSort("address")}>
                                                    <div className="flex items-center gap-1">Addr {sortField === "address" && <FaSort className="h-3 w-3 text-neutral-800" />}</div>
                                                </TableHead>
                                                <TableHead className="min-w-[65px] text-xs sm:text-sm cursor-pointer hover:bg-neutral-300 px-1 font-black text-neutral-900 transition-colors duration-200" onClick={() => handleSort("mobileNumber")}>
                                                    <div className="flex items-center gap-1">Mobile {sortField === "mobileNumber" && <FaSort className="h-3 w-3 text-neutral-800" />}</div>
                                                </TableHead>
                                                <TableHead className="min-w-[60px] text-xs sm:text-sm px-1">
                                                    <div className="flex items-center gap-1">
                                                        <select
                                                            value={bankFilter || ""}
                                                            onChange={(e) => setBankFilter(e.target.value || null)}
                                                            className="text-xs px-1 py-0.5 border rounded bg-white cursor-pointer w-full"
                                                        >
                                                            <option value="">Bank</option>
                                                            {uniqueBanks.map(bank => (
                                                                <option key={bank} value={bank}>{bank}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="min-w-[65px] text-xs sm:text-sm px-1">
                                                    <div className="flex items-center gap-1">
                                                        <select
                                                            value={engineerFilter || ""}
                                                            onChange={(e) => setEngineerFilter(e.target.value || null)}
                                                            className="text-xs px-1 py-0.5 border rounded bg-white cursor-pointer w-full"
                                                        >
                                                            <option value="">Eng</option>
                                                            {uniqueEngineers.map(engineer => (
                                                                <option key={engineer} value={engineer}>{engineer}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="min-w-[60px] text-xs sm:text-sm px-1">
                                                    <div className="flex items-center gap-1">
                                                        <select
                                                            value={cityFilter || ""}
                                                            onChange={(e) => setCityFilter(e.target.value || null)}
                                                            className="text-xs px-1 py-0.5 border rounded bg-white cursor-pointer w-full"
                                                        >
                                                            <option value="">City</option>
                                                            {uniqueCities.map(city => (
                                                                <option key={city} value={city}>{city}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </TableHead>
                                                <TableHead className="min-w-[50px] text-xs sm:text-sm cursor-pointer hover:bg-neutral-300 px-1 font-black text-neutral-900 transition-colors duration-200" onClick={() => handleSort("payment")}>
                                                    <div className="flex items-center gap-1">Pay {sortField === "payment" && <FaSort className="h-3 w-3 text-neutral-800" />}</div>
                                                </TableHead>
                                                <TableHead className="min-w-[50px] text-xs sm:text-sm cursor-pointer hover:bg-neutral-300 px-1 font-black text-neutral-900 transition-colors duration-200" onClick={() => handleSort("status")}>
                                                    <div className="flex items-center gap-1">Sts {sortField === "status" && <FaSort className="h-3 w-3 text-neutral-800" />}</div>
                                                </TableHead>
                                                <TableHead className="min-w-[60px] text-xs sm:text-sm cursor-pointer hover:bg-neutral-300 px-1 font-black text-neutral-900 transition-colors duration-200" onClick={() => handleSort("duration")}>
                                                    <div className="flex items-center gap-1">Dur {sortField === "duration" && <FaSort className="h-3 w-3 text-neutral-800" />}</div>
                                                </TableHead>
                                                <TableHead className="min-w-[85px] text-xs sm:text-sm cursor-pointer hover:bg-neutral-300 px-1 font-black text-neutral-900 transition-colors duration-200" onClick={() => handleSort("createdAt")}>
                                                    <div className="flex items-center gap-1">Date {sortField === "createdAt" && <FaSort className="h-3 w-3 text-neutral-800" />}</div>
                                                </TableHead>
                                                <TableHead className="min-w-[100px] text-xs sm:text-sm px-1">Notes</TableHead>
                                                <TableHead className="min-w-[70px] text-xs sm:text-sm px-1">Acts</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedFiles.map((record) => (
                                                <TableRow key={record._id} className="hover:bg-neutral-100 border-b border-neutral-200 transition-colors duration-200">
                                                    <TableCell className="text-sm text-center px-1 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRows.has(record._id)}
                                                            onChange={() => handleCheckboxChange(record._id)}
                                                            className="w-4 h-4 cursor-pointer accent-neutral-700 rounded"
                                                        />



                                                    </TableCell>
                                                    <TableCell className={`text-sm font-black text-neutral-900 ${record.address && record.address.length > 50 ? 'whitespace-normal' : ''}`}>{record.clientName}</TableCell>
                                                    <TableCell className={`text-sm font-semibold text-neutral-700 ${record.address && record.address.length > 50 ? 'max-w-[200px] whitespace-normal break-words' : 'max-w-[140px] truncate'}`}>{record.address}</TableCell>
                                                    <TableCell className="text-xs px-1 py-2 truncate font-semibold text-neutral-700">{record.mobileNumber}</TableCell>
                                                    <TableCell className="text-xs px-1 py-2 font-semibold text-neutral-700">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="truncate">{record.bankName}</span>
                                                            {record.selectedForm && (
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white w-fit ${
                                                                    record.selectedForm === 'ubiShop' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                                                    record.selectedForm === 'bomFlat' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                                                                    record.selectedForm === 'ubiApf' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                                                                    'bg-gradient-to-r from-gray-500 to-gray-600'
                                                                }`}>
                                                                    {record.selectedForm === 'ubiShop' ? 'UBI Shop' :
                                                                     record.selectedForm === 'bomFlat' ? 'BOM Flat' :
                                                                     record.selectedForm === 'ubiApf' ? 'UBI APF' :
                                                                     record.selectedForm}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs px-1 py-2 truncate font-semibold text-neutral-700">{record.engineerName}</TableCell>
                                                    <TableCell className="text-xs px-1 py-2 truncate font-semibold text-neutral-700">{record.city}</TableCell>
                                                    <TableCell className="px-1 py-2">
                                                        <Badge variant={record.payment === "yes" ? "success" : "warning"} className="text-xs px-2 py-1 font-bold shadow-sm">
                                                            {record.payment === "yes" ? "Y" : "N"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-1 py-2 text-center">{getStatusBadge(record.status)}</TableCell>
                                                    <TableCell className="px-1 py-2">
                                                        {timeDurations[record._id] ? (
                                                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-slate-100 px-2 py-1 font-bold border-blue-300 shadow-sm">{timeDurations[record._id].days}:{timeDurations[record._id].hours}:{timeDurations[record._id].minutes}:{timeDurations[record._id].seconds}</Badge>
                                                        ) : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-xs sm:text-sm px-1 py-2 font-semibold text-slate-700">
                                                        {record.dateTime || record.createdAt ? (
                                                            <>
                                                                <div>{new Date(record.dateTime || record.createdAt).toLocaleDateString()}</div>
                                                                <div className="text-slate-600 text-xs">{new Date(record.dateTime || record.createdAt).toLocaleTimeString()}</div>
                                                            </>
                                                        ) : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-xs max-w-[100px] px-1 py-2">
                                                        {record.notes ? (
                                                            <div className="whitespace-normal break-words line-clamp-1 text-xs font-semibold text-slate-700" title={record.notes}>
                                                                {record.notes}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-500 font-medium">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-1 py-2">
                                                        <div className="flex flex-wrap gap-1">
                                                            {role === "user" && normalizeStatus(record.status) === "pending" && (
                                                                <Badge
                                                                    variant="warning"
                                                                    className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 flex items-center gap-1.5"
                                                                    onClick={() => {
                                                                        console.log("🟡 Pending Edit Badge clicked - record:", record);
                                                                        navigateToEditForm(record);
                                                                    }}
                                                                    title="Edit Form"
                                                                >
                                                                    <FaEdit className="h-3 w-3" />
                                                                </Badge>
                                                            )}
                                                            {role === "user" && normalizeStatus(record.status) === "on-progress" && (
                                                                <Badge
                                                                    variant="default"
                                                                    className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 bg-blue-600 flex items-center gap-1.5"
                                                                    onClick={() => {
                                                                        console.log("🔵 On-Progress Edit Badge clicked - record:", record);
                                                                        navigateToEditForm(record);
                                                                    }}
                                                                    title="Edit Form"
                                                                >
                                                                    <FaEdit className="h-3 w-3" />
                                                                </Badge>
                                                            )}
                                                            {role === "user" && normalizeStatus(record.status) === "rejected" && (
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 flex items-center gap-1.5"
                                                                    onClick={() => {
                                                                        console.log("🔴 Rejected Edit Badge clicked - record:", record);
                                                                        navigateToEditForm(record);
                                                                    }}
                                                                    title="Edit Form"
                                                                >
                                                                    <FaEdit className="h-3 w-3" />
                                                                </Badge>
                                                            )}
                                                            {normalizeStatus(record.status) === "approved" && (
                                                                <>
                                                                    <Badge
                                                                        variant="success"
                                                                        className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 flex items-center gap-1.5 bg-green-600 hover:bg-green-700 border border-green-700"
                                                                        onClick={() => handleDownloadPDF(record)}
                                                                        title="Download PDF - Red Badge"
                                                                    >
                                                                        <FaDownload className="h-3 w-3" />
                                                                        <span className="hidden sm:inline text-xs">PDF</span>
                                                                    </Badge>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 flex items-center gap-1.5 bg-blue-50 border-2 border-blue-600 text-blue-700 hover:bg-blue-100 hover:border-blue-700"
                                                                        onClick={() => handleDownloadDOCX(record)}
                                                                        title="Download Word Document (.docx)"
                                                                    >
                                                                        <FaFileAlt className="h-3 w-3" />
                                                                        <span className="hidden sm:inline text-xs">DOCX</span>
                                                                    </Badge>
                                                                </>
                                                            )}
                                                            {(role === "manager" || role === "admin") && (normalizeStatus(record.status) === "pending" || normalizeStatus(record.status) === "on-progress") && (
                                                                <Badge
                                                                    variant="default"
                                                                    className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 bg-blue-600 flex items-center gap-1.5"
                                                                    onClick={() => {
                                                                        console.log("👁️ Manager Review Badge clicked - record:", record);
                                                                        navigateToEditForm(record);
                                                                    }}
                                                                    title="Review Form"
                                                                >
                                                                    <FaEye className="h-3 w-3" />
                                                                </Badge>
                                                            )}
                                                            {(role === "manager" || role === "admin") && (normalizeStatus(record.status) === "rejected" || normalizeStatus(record.status) === "rework") && (
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 flex items-center gap-1.5"
                                                                    onClick={() => {
                                                                        console.log("🟠 Manager Rework/Rejected Badge clicked - record:", record);
                                                                        navigateToEditForm(record);
                                                                    }}
                                                                    title="Edit Form"
                                                                >
                                                                    <FaEdit className="h-3 w-3" />
                                                                </Badge>
                                                            )}
                                                            {(role === "manager" || role === "admin") && normalizeStatus(record.status) === "approved" && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 bg-purple-50 border-purple-400 text-purple-700 flex items-center gap-1.5"
                                                                    onClick={() => handleReworkRequest(record)}
                                                                    title="Request Rework"
                                                                >
                                                                    <FaRedo className="h-3 w-3" />
                                                                </Badge>
                                                            )}
                                                            {role === "user" && normalizeStatus(record.status) === "rework" && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs px-2.5 py-1.5 cursor-pointer hover:shadow-lg hover:scale-110 font-bold transition-all duration-200 bg-orange-50 border-orange-400 text-orange-700 flex items-center gap-1.5"
                                                                    onClick={() => {
                                                                        console.log("🟠 Rework Badge clicked - record:", record);
                                                                        navigateToEditForm(record);
                                                                    }}
                                                                    title="Rework Form"
                                                                >
                                                                    <FaRedo className="h-3 w-3" />
                                                                </Badge>
                                                            )}

                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {showChat && (
  <div className="fixed bottom-20 right-6 w-80 bg-white shadow-xl border border-neutral-300 rounded-xl z-50">
    {/* Chat Header */}
    <div className="p-3 bg-blue-600 text-white rounded-t-xl flex justify-between items-center">
      <span className="font-semibold">AI Assistant</span>
      <button onClick={() => setShowChat(false)}>
        <FaTimes className="h-4 w-4" />
      </button>
    </div>

    {/* Messages Box */}
    <div
      id="aiChatBox"
      className="p-3 h-64 overflow-y-auto text-sm text-neutral-800 space-y-2"
    >
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`p-2 rounded-lg max-w-[90%] ${
            msg.sender === "user"
              ? "ml-auto bg-blue-100 text-blue-900"
              : "mr-auto bg-neutral-200"
          }`}
        >
          {msg.text}
        </div>
      ))}
    </div>

    {/* Input */}
    <div className="p-3 border-t border-neutral-300">
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-neutral-300 rounded-lg px-2 py-1 text-sm"
          placeholder="Ask me anything..."
          required
        />
        <button className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm">
          Send
        </button>
      </form>
    </div>
  </div>
)}

                                    
                                </div>
                                <div className="flex-shrink-0 border-t border-neutral-300 bg-neutral-50">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={(page) => dispatch(setCurrentPage(page))}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <div className="mb-4 flex justify-center">
                                    <div className="p-4 bg-neutral-200 rounded-full">
                                        <FaEye className="h-12 w-12 text-neutral-700" />
                                    </div>
                                </div>
                                <p className="text-neutral-700 font-semibold text-lg">No data found</p>
                                <p className="text-neutral-600 text-sm mt-1">Try adjusting your filters or create a new record</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Login Modal */}
            <LoginModal
                isOpen={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                onLogin={(userData) => {
                    if (onLogin) {
                        onLogin(userData);
                    }
                    setLoginModalOpen(false);
                }}
            />

            {/* Logout Confirmation Dialog */}
            <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Logout</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to logout? You will be redirected to the login page.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setLogoutModalOpen(false)}
                            disabled={loggingOut}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            disabled={loggingOut}
                        >
                            {loggingOut ? "Logging out..." : "Logout"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rework Modal */}
            <ReworkModal
                isOpen={reworkModalOpen}
                onClose={() => {
                    setReworkModalOpen(false);
                    setReworkingRecordId(null);
                }}
                onSubmit={handleReworkSubmit}
                isLoading={reworkLoading}
            />
            {/* Floating Chat Icon */}
<button
  onClick={() => setShowChat(true)}
  className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all z-50"
  title="AI Assistant"
>
  <FaComments className="h-5 w-5" />
</button>

        </div>
    );
};
export default DashboardPage;