import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaWhatsapp } from "react-icons/fa";
import { FaSignOutAlt, FaPlus, FaDownload, FaSyncAlt, FaEye, FaSort, FaChartBar, FaLock, FaClock, FaSpinner, FaCheckCircle, FaTimesCircle, FaEdit, FaFileAlt, FaCreditCard, FaRedo, FaHeadset } from "react-icons/fa";
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
import { FaFileInvoice } from 'react-icons/fa';

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
    const handleOpenHelplineWhatsApp = () => {
        // Helpline WhatsApp with pre-filled message
        // Phone number with country code (India: +91)
        const phoneNumber = "919327361477";
        const message = encodeURIComponent("Hi, how can I help you?");
        const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;
        console.log("🟢 Helpline WhatsApp URL:", whatsappURL);
        window.open(whatsappURL, "_blank");
    };

    const handleOpenPersonalWhatsApp = () => {
        // Personal WhatsApp - opens user's own WhatsApp without specifying a contact
        const whatsappURL = `https://web.whatsapp.com/`;
        console.log("🔵 Personal WhatsApp URL:", whatsappURL);
        window.open(whatsappURL, "_blank");
    };

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

    // Handle select-all checkbox in header
    const handleSelectAll = () => {
        if (selectedRows.size === paginatedFiles.length && paginatedFiles.length > 0) {
            // All rows currently selected → deselect all on current page
            setSelectedRows(new Set());
            setCopiedRows(new Map());
        } else {
            // Select all rows on current page
            const newSelected = new Set(selectedRows);
            const newCopied = new Map(copiedRows);

            paginatedFiles.forEach(record => {
                newSelected.add(record._id);
                newCopied.set(record._id, record);
            });

            setSelectedRows(newSelected);
            setCopiedRows(newCopied);
        }
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

    const navigateToBillForm = (selectedRecords) => {
        // Extract only the required fields: Clnt, Addr, Mobile, Bank, City
        const selectedData = selectedRecords.map(record => ({
            clnt: record.clientName,
            addr: record.address,
            mobile: record.mobileNumber,
            bank: record.bankName,
            city: record.city,
            // Keep original _id for reference if needed
            _id: record._id
        }));

        // Store in localStorage for persistence
        localStorage.setItem('selectedValuationForms', JSON.stringify(selectedData));

        // Navigate to bill form with state
        navigate('/bills/create', {
            state: {
                selectedRows: selectedData,
                fromValuation: true
            }
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
        <div
            onClick={() => status && setStatusFilter(statusFilter === status ? null : status)}
            className={`overflow-hidden hover:shadow-md transition-all duration-300 ${status ? 'cursor-pointer' : 'cursor-default'} border-l-4 relative group ${status && statusFilter === status ? `border-l-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-300` : `border-l-neutral-200 bg-white hover:border-l-neutral-300 hover:shadow-sm`} rounded px-2.5 py-2 flex-shrink-0 flex items-center justify-center min-w-max`}
        >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} group-hover:h-1 transition-all duration-300`}></div>
            <div className="flex items-center justify-center gap-2 pt-0.5">
                <div className="text-center">
                    <p className={`text-xs font-semibold mb-1 leading-tight whitespace-nowrap transition-colors duration-300 ${status && statusFilter === status ? 'text-blue-700 font-bold' : 'text-neutral-600'}`}>{title}</p>
                    <p className={`text-lg font-black bg-gradient-to-r ${color} bg-clip-text text-transparent leading-tight`}>{value}</p>
                </div>
                {Icon && <Icon className={`h-3.5 w-3.5 flex-shrink-0 transition-all duration-300 ${status && statusFilter === status ? 'opacity-70' : 'opacity-35 group-hover:opacity-45'}`} />}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-white via-blue-50 to-white text-neutral-900 shadow-lg hover:shadow-xl sticky top-0 z-40 border-b-2 border-blue-200 transition-all duration-300">
                <div className="px-3 sm:px-8 py-3 sm:py-4">
                    {/* Top Row - Logo, Status Cards, Search, and Controls */}
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                        {/* Logo Section - Premium Design */}
                        <div className="flex items-center gap-3 flex-shrink-0 h-10 pr-4 sm:pr-6 border-r-2 border-blue-200 group">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 text-white">
                                <FaChartBar className="text-lg sm:text-xl" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-black tracking-tight text-neutral-900 whitespace-nowrap leading-tight">Valu Soft</h1>
                                <p className="text-xs text-blue-600 font-bold mt-0 hidden sm:block leading-tight tracking-wide">
                                    {!isLoggedIn ? "Read-Only" : role === "user" ? "Submissions" : role === "manager" ? "Review" : "Admin"}
                                </p>
                            </div>
                        </div>

                        {/* Status Cards Row - Premium Compact */}
                        <div className="flex items-center gap-2 flex-shrink-0 overflow-hidden h-10 px-2 py-1">
                            <StatCard
                                title="Pending"
                                value={pendingCount}
                                color="from-amber-600 to-amber-700"
                                status="pending"
                                icon={FaClock}
                            />
                            <StatCard
                                title="Progress"
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
                                title="Complete"
                                value={`${completionRate}%`}
                                color="from-indigo-600 to-indigo-700"
                                status={null}
                                icon={FaCheckCircle}
                            />
                        </div>

                        {/* Search Bar */}
                        <div className="hidden sm:flex flex-1 min-w-0 h-10 items-center px-4">
                            <SearchBar data={files} />
                        </div>

                        {/* Right Actions - Premium Style */}
                        <div className="flex items-center gap-3 flex-shrink-0 h-10 pl-4 sm:pl-6 border-l-2 border-blue-200">
                            <button
                                onClick={() => navigate("/valuationform")}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 h-8 w-8 sm:h-9 sm:w-9 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 inline-flex items-center justify-center flex-shrink-0 rounded-lg border border-blue-800 hover:border-blue-900"
                                title="New Form"
                            >
                                <FaPlus style={{ fontSize: "13px" }} />
                            </button>
                            {role !== "user" && (
                                <button
                                    onClick={() => navigate("/bills")}
                                    className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 h-8 w-8 sm:h-9 sm:w-9 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 inline-flex items-center justify-center flex-shrink-0 rounded-lg border border-green-800 hover:border-green-900"
                                    title="Bills"
                                >
                                    <FaCreditCard style={{ fontSize: "13px" }} />
                                </button>
                            )}

                            <button
                                onClick={handleOpenHelplineWhatsApp}
                                className="bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 h-8 w-8 sm:h-9 sm:w-9 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 inline-flex items-center justify-center flex-shrink-0 rounded-lg border border-red-800 hover:border-red-900"
                                title="Contact Helpline on WhatsApp"
                            >
                                <FaHeadset style={{ fontSize: "13px" }} />
                            </button>

                            <div className="h-6 w-px bg-blue-200"></div>

                            {!isLoggedIn ? (
                                <Button
                                    onClick={() => setLoginModalOpen(true)}
                                    className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-2.5 h-8 sm:h-9 flex items-center gap-1 font-bold shadow-sm hover:shadow-md transition-all duration-300 border border-blue-700"
                                    title="Login"
                                >
                                    <FaLock className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Login</span>
                                </Button>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1.5 bg-neutral-100 px-2 py-1 rounded border border-neutral-200 hover:bg-neutral-150 transition-all duration-300 h-8 sm:h-9">
                                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-white shadow-sm border border-blue-700">
                                            <span className="text-xs font-black">{username[0]?.toUpperCase()}</span>
                                        </div>
                                        <div className="hidden sm:block min-w-0 flex-1">
                                            <p className="text-xs font-semibold truncate text-neutral-900 leading-tight">{username}</p>
                                            <p className="text-xs text-neutral-500 uppercase tracking-wider truncate font-medium leading-tight">{role}</p>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 h-8 w-8 sm:h-9 sm:w-9 transition-all duration-300 hover:shadow-md rounded"
                                        onClick={() => setLogoutModalOpen(true)}
                                        title="Logout"
                                    >
                                        <FaSignOutAlt className="h-4 w-4 sm:h-4 sm:w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="bg-gradient-to-b from-white to-neutral-50">
                {/* Unified Container - Status Graph & Table with consistent width & alignment */}
                <div className="px-4 sm:px-6 md:px-8">
                    {/* Analytics Graphs - Compact - with minimal top spacing */}
                    {files.length > 0 && (
                        <div className="pt-2 sm:pt-3 md:pt-4 pb-1 sm:pb-1.5 md:pb-1 animate-fadeIn">
                            <StatusGraph files={files} isCompact={true} />
                        </div>
                    )}

                    {/* Search Bar & Table Container - Padded */}
                    <div className="space-y-5 sm:space-y-6 md:space-y-8 pb-8 sm:pb-10 md:pb-12">
                        {/* Search Bar - Mobile Only */}
                        <div className="sm:hidden">
                            <SearchBar data={files} />
                        </div>

                        {/* Data Table - Premium Card */}
                        <Card className="overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 border-t-4 border-t-slate-700 bg-white rounded-3xl border border-gray-200/50">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 border-b border-slate-600 py-3 sm:py-4 shadow-sm">
                                <div>
                                    <CardTitle className="text-base sm:text-xl font-bold flex items-center gap-2 text-white tracking-tight">
                                        <div className="p-1.5 bg-white/15 rounded-lg shadow-sm backdrop-blur-sm border border-white/20">
                                            <FaEye className="text-white text-base" />
                                        </div>
                                        Valuation Forms
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1.5 text-slate-300 font-medium">{sortedFiles.length} records {statusFilter && `— filtered`}</CardDescription>
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
                                            className="text-xs sm:text-sm px-3 sm:px-4 font-bold border-2 border-blue-400 text-blue-600 bg-white hover:border-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
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
                                                className="text-xs sm:text-sm px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 border-2 border-blue-700 hover:scale-105"
                                            >
                                                Copy {selectedRows.size}
                                            </Button>
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => {
                                                    const selectedRecords = files.filter(r => selectedRows.has(r._id));
                                                    if (selectedRecords.length > 0) {
                                                        navigateToBillForm(selectedRecords);
                                                    }
                                                }}
                                                className="text-xs sm:text-sm px-3 sm:px-4 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-300 border-2 border-green-700 hover:scale-105"
                                            >
                                                <FaFileInvoice className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                                                Create Bill ({selectedRows.size})
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedRows(new Set())}
                                                className="text-xs sm:text-sm px-3 sm:px-4 font-bold border-2 border-neutral-400 text-neutral-600 bg-white hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 shadow-md hover:shadow-lg"
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
                                        className="text-xs sm:text-sm px-3 sm:px-4 font-bold border-2 border-blue-400 text-blue-600 bg-white hover:border-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:border-neutral-300 disabled:text-neutral-400"
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
                                                    <TableRow className="hover:bg-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-slate-600 border-b-2 border-blue-700 transition-colors duration-200">
                                                        <TableHead className="min-w-[40px] text-xs sm:text-sm px-2 py-3 font-black text-white">
                                                            <div className="flex items-center gap-1 justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={paginatedFiles.length > 0 && selectedRows.size === paginatedFiles.length}
                                                                    onChange={handleSelectAll}
                                                                    className="w-4 h-4 cursor-pointer accent-blue-400 rounded"
                                                                    title="Select all rows on this page"
                                                                />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[75px] text-xs sm:text-sm px-2 py-3 cursor-pointer hover:bg-blue-500 font-black text-white transition-colors duration-300 rounded-t-lg" onClick={() => handleSort("clientName")}>
                                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                                <span className="font-bold tracking-wide text-blue-200">CLNT</span>
                                                                {sortField === "clientName" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[85px] text-xs sm:text-sm px-2 py-3 cursor-pointer hover:bg-blue-500 font-black text-white transition-colors duration-300" onClick={() => handleSort("address")}>
                                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                                <span className="font-bold tracking-wide text-blue-200">ADDR</span>
                                                                {sortField === "address" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[85px] text-xs sm:text-sm px-2 py-3 cursor-pointer hover:bg-blue-500 font-black text-white transition-colors duration-300" onClick={() => handleSort("mobileNumber")}>
                                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                                <span className="font-bold tracking-wide text-blue-200">MOBILE</span>
                                                                {sortField === "mobileNumber" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[75px] text-xs sm:text-sm px-2 py-3">
                                                            <select
                                                                value={bankFilter || ""}
                                                                onChange={(e) => setBankFilter(e.target.value || null)}
                                                                className="text-xs px-2.5 py-1.5 border-2 border-blue-400 rounded-md bg-white text-neutral-900 font-bold cursor-pointer w-full focus:outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-200 hover:border-blue-300 transition-all shadow-md h-8"
                                                                title="Filter by Bank"
                                                            >
                                                                <option value="" className="font-semibold">BANK</option>
                                                                {uniqueBanks.map(bank => (
                                                                    <option key={bank} value={bank}>{bank}</option>
                                                                ))}
                                                            </select>
                                                        </TableHead>
                                                        <TableHead className="min-w-[75px] text-xs sm:text-sm px-2 py-3">
                                                            <select
                                                                value={engineerFilter || ""}
                                                                onChange={(e) => setEngineerFilter(e.target.value || null)}
                                                                className="text-xs px-2.5 py-1.5 border-2 border-blue-400 rounded-md bg-white text-neutral-900 font-bold cursor-pointer w-full focus:outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-200 hover:border-blue-300 transition-all shadow-md h-8"
                                                                title="Filter by Engineer"
                                                            >
                                                                <option value="" className="font-semibold">ENG</option>
                                                                {uniqueEngineers.map(engineer => (
                                                                    <option key={engineer} value={engineer}>{engineer}</option>
                                                                ))}
                                                            </select>
                                                        </TableHead>
                                                        <TableHead className="min-w-[75px] text-xs sm:text-sm px-2 py-3">
                                                            <select
                                                                value={cityFilter || ""}
                                                                onChange={(e) => setCityFilter(e.target.value || null)}
                                                                className="text-xs px-2.5 py-1.5 border-2 border-blue-400 rounded-md bg-white text-neutral-900 font-bold cursor-pointer w-full focus:outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-200 hover:border-blue-300 transition-all shadow-md h-8"
                                                                title="Filter by City"
                                                            >
                                                                <option value="" className="font-semibold">CITY</option>
                                                                {uniqueCities.map(city => (
                                                                    <option key={city} value={city}>{city}</option>
                                                                ))}
                                                            </select>
                                                        </TableHead>
                                                        <TableHead className="min-w-[60px] text-xs sm:text-sm px-2 py-3 cursor-pointer hover:bg-blue-500 font-black text-white transition-colors duration-300" onClick={() => handleSort("payment")}>
                                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                                <span className="font-bold tracking-wide text-blue-200">PAY</span>
                                                                {sortField === "payment" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[60px] text-xs sm:text-sm px-2 py-3 cursor-pointer hover:bg-blue-500 font-black text-white transition-colors duration-300" onClick={() => handleSort("status")}>
                                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                                <span className="font-bold tracking-wide text-blue-200">STS</span>
                                                                {sortField === "status" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[70px] text-xs sm:text-sm px-2 py-3 cursor-pointer hover:bg-blue-500 font-black text-white transition-colors duration-300" onClick={() => handleSort("duration")}>
                                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                                <span className="font-bold tracking-wide text-blue-200">DUR</span>
                                                                {sortField === "duration" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[95px] text-xs sm:text-sm px-2 py-3 cursor-pointer hover:bg-blue-500 font-black text-white transition-colors duration-300" onClick={() => handleSort("createdAt")}>
                                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                                <span className="font-bold tracking-wide text-blue-200">DATE</span>
                                                                {sortField === "createdAt" && <FaSort className="h-3 w-3 text-blue-200" />}
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="min-w-[110px] text-xs sm:text-sm px-2 py-3 font-black text-white">
                                                            <span className="font-bold tracking-wide text-blue-200">NOTES</span>
                                                        </TableHead>
                                                        <TableHead className="min-w-[80px] text-xs sm:text-sm px-2 py-3 font-black text-white">
                                                            <span className="font-bold tracking-wide text-blue-200">ACTS</span>
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginatedFiles.map((record) => (
                                                        <TableRow key={record._id} className="hover:bg-blue-50 border-b border-neutral-200 transition-all duration-300 hover:shadow-md hover:border-blue-400 group hover:scale-y-105">
                                                            <TableCell className="text-sm text-center px-1 py-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedRows.has(record._id)}
                                                                    onChange={() => handleCheckboxChange(record._id)}
                                                                    className="w-4 h-4 cursor-pointer accent-neutral-700 rounded"
                                                                />



                                                            </TableCell>
                                                            <TableCell className={`text-sm font-black text-neutral-900 group-hover:text-blue-700 transition-colors duration-200 ${record.address && record.address.length > 50 ? 'whitespace-normal' : ''}`}>{record.clientName}</TableCell>
                                                            <TableCell className={`text-sm font-semibold text-neutral-700 group-hover:text-neutral-900 transition-colors duration-200 ${record.address && record.address.length > 50 ? 'max-w-[200px] whitespace-normal break-words' : 'max-w-[140px] truncate'}`}>{record.address}</TableCell>
                                                            <TableCell className="text-xs px-1 py-2 truncate font-semibold text-neutral-700 group-hover:text-neutral-900 transition-colors duration-200">{record.mobileNumber}</TableCell>
                                                            <TableCell className="text-xs px-1 py-2 font-semibold text-neutral-700">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="truncate">{record.bankName}</span>
                                                                    {record.selectedForm && (
                                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white w-fit ${record.selectedForm === 'ubiShop' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
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


                                        </div>
                                        <div className="flex-shrink-0 border-t-2 border-blue-300 bg-gradient-to-r from-blue-50 via-white to-blue-50 shadow-sm border border-blue-100/50">
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                onPageChange={(page) => dispatch(setCurrentPage(page))}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-24">
                                        <div className="mb-6 flex justify-center">
                                            <div className="p-6 bg-gradient-to-br from-blue-100 via-blue-50 to-slate-100 rounded-3xl shadow-lg">
                                                <FaEye className="h-20 w-20 text-blue-600" />
                                            </div>
                                        </div>
                                        <p className="text-neutral-900 font-bold text-2xl tracking-tight">No data found</p>
                                        <p className="text-neutral-600 text-sm mt-3 font-medium">Try adjusting your filters or create a new record</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
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

            {/* Floating Personal WhatsApp Button */}
            <button
                onClick={handleOpenPersonalWhatsApp}
                className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 hover:scale-110 transition-all z-50"
                title="Open Personal WhatsApp"
            >
                <FaWhatsapp className="h-6 w-6" />
            </button>

        </div>
    );
};
export default DashboardPage;  