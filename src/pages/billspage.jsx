import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBills, deleteBill } from "../services/billService";
import { invalidateCache } from "../services/axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../components/ui/dialog";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import Badge from "../components/ui/badge";
import { AiOutlineEye, AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { FaSyncAlt, FaPlus, FaFileInvoice, FaArrowLeft, FaFilePdf } from "react-icons/fa";

const BillsPage = ({ user }) => {
    const navigate = useNavigate();
    const role = user?.role || "";
    const [bills, setBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, billNumber: null });

    const itemsPerPage = 10;

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async () => {
        try {
            setLoading(true);
            setError("");
            invalidateCache("/bills");
            const response = await getAllBills();
            if (response.success === true && response.data) {
                setBills(response.data);
                setFilteredBills(response.data);
            } else if (response.success === true) {
                setBills([]);
                setFilteredBills([]);
            } else {
                setError(response.message || "Error loading bills");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error loading bills");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        filterBills(term);
        setCurrentPage(1);
    };



    const filterBills = (term) => {
        let filtered = bills;

        if (term) {
            const searchLower = term.toLowerCase();
            filtered = filtered.filter((bill) => {
                return (
                    bill.billNumber?.toLowerCase().includes(searchLower) ||
                    bill.billMonth?.toLowerCase().includes(searchLower) ||
                    bill.billDate?.toLowerCase().includes(searchLower) ||
                    bill.vendorName?.toLowerCase().includes(searchLower) ||
                    bill.vendorPan?.toLowerCase().includes(searchLower) ||
                    bill.vendorGst?.toLowerCase().includes(searchLower) ||
                    bill.billToName?.toLowerCase().includes(searchLower) ||
                    bill.billToPan?.toLowerCase().includes(searchLower) ||
                    bill.billToGstin?.toLowerCase().includes(searchLower) ||
                    bill.bankDetails?.beneficiary?.toLowerCase().includes(searchLower) ||
                    bill.bankDetails?.bankName?.toLowerCase().includes(searchLower) ||
                    bill.bankDetails?.accountNo?.toLowerCase().includes(searchLower) ||
                    bill.bankDetails?.ifscCode?.toLowerCase().includes(searchLower) ||
                    bill.signerName?.toLowerCase().includes(searchLower) ||
                    bill.place?.toLowerCase().includes(searchLower) ||
                    bill.grandTotal?.toString().includes(term)
                );
            });
        }

        setFilteredBills(filtered);
    };

    const handleDeleteClick = (billNumber) => {
        setDeleteModal({ isOpen: true, billNumber });
    };

    const handleDeleteConfirm = async () => {
        try {
            const response = await deleteBill(deleteModal.billNumber);
            if (response.success) {
                setDeleteModal({ isOpen: false, billNumber: null });
                loadBills();
            } else {
                alert(response.message || "Error deleting bill");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Error deleting bill");
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, billNumber: null });
    };

    const handleDownloadPDF = (billNumber) => {
        window.open(`/api/bills/${billNumber}/pdf`, "_blank");
    };





    // Pagination
    const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBills = filteredBills.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block p-3 bg-neutral-100 rounded-full mb-4">
                        <FaFileInvoice className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-neutral-600 font-semibold">Loading bills...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/")}
                    className="h-9 w-9 border border-neutral-300 hover:bg-neutral-100 hover:border-blue-400 rounded-lg p-0 transition-colors"
                >
                    <FaArrowLeft className="h-4 w-4 text-neutral-700" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Bills Management</h1>
                    <p className="text-xs text-neutral-500 mt-1">View and manage all bills</p>
                </div>
            </div>

            {/* Main Content - 2-Column Layout (Full Height Optimized) */}
            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
                {/* Left Column - Summary Stats */}
                <div className="col-span-12 sm:col-span-3 lg:col-span-2">
                    <Card className="border border-neutral-200 bg-white rounded-lg overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-neutral-900">
                                <FaFileInvoice className="h-4 w-4 text-blue-500" />
                                Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 overflow-y-auto flex-1">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Total Bills</p>
                                <p className="text-lg font-bold text-neutral-900">{bills.length}</p>
                            </div>
                            <div className="border-t border-neutral-200"></div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Showing</p>
                                <p className="text-lg font-bold text-neutral-900">{filteredBills.length}</p>
                            </div>
                            <div className="border-t border-neutral-200"></div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Page Items</p>
                                <p className="text-lg font-bold text-neutral-900">{paginatedBills.length}</p>
                            </div>
                            {error && (
                                <>
                                    <div className="border-t border-neutral-200"></div>
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                                        <p className="font-semibold mb-1">Error</p>
                                        <p>{error}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Bills Table */}
                <div className="col-span-12 sm:col-span-9 lg:col-span-10">
                    <Card className="border border-neutral-200 shadow-sm bg-white rounded-lg overflow-hidden h-full flex flex-col">
                        <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200">
                            {/* Title */}
                            <CardTitle className="text-sm font-bold flex items-center gap-2 mb-3">
                                <FaFileInvoice className="h-4 w-4 text-blue-500" />
                                Bills List
                            </CardTitle>

                            {/* Search Bar */}
                            <div className="mb-3">
                                <SearchBar
                                    placeholder="Search bills..."
                                    onSearch={handleSearch}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={loadBills}
                                    className="border border-neutral-300 text-neutral-900 hover:bg-neutral-100 font-semibold transition-all duration-300 whitespace-nowrap"
                                    size="sm"
                                >
                                    <FaSyncAlt className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                                {(role === "manager" || role === "admin") && (
                                    <Button
                                        onClick={() => navigate("/bills/create")}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all duration-300 whitespace-nowrap"
                                        size="sm"
                                    >
                                        <FaPlus className="h-4 w-4 mr-2" />
                                        Create
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-y-auto flex-1">
                        {paginatedBills.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-neutral-100 border border-neutral-300">
                                            <tr>
                                                <th className="border border-neutral-300 px-4 py-3 text-center text-xs font-bold text-neutral-900">
                                                    Sr.No
                                                </th>
                                                <th className="border border-neutral-300 px-4 py-3 text-center text-xs font-bold text-neutral-900">
                                                    Date
                                                </th>
                                                <th className="border border-neutral-300 px-4 py-3 text-center text-xs font-bold text-neutral-900">
                                                    Bill Number
                                                </th>
                                                <th className="border border-neutral-300 px-4 py-3 text-center text-xs font-bold text-neutral-900">
                                                    Vendor Name
                                                </th>
                                                <th className="border border-neutral-300 px-4 py-3 text-center text-xs font-bold text-neutral-900">
                                                    Bill To
                                                </th>
                                                <th className="border border-neutral-300 px-4 py-3 text-center text-xs font-bold text-neutral-900">
                                                    Amount
                                                </th>
                                                <th className="border border-neutral-300 px-4 py-3 text-center text-xs font-bold text-neutral-900">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedBills.map((bill, index) => (
                                                <tr
                                                    key={bill._id}
                                                    className="border border-neutral-300 hover:bg-neutral-50 transition-colors duration-200"
                                                >
                                                    <td className="border border-neutral-300 px-4 py-3 text-center text-sm font-semibold text-neutral-900">
                                                        {startIndex + index + 1}
                                                    </td>
                                                    <td className="border border-neutral-300 px-4 py-3 text-center text-sm text-neutral-700">
                                                        {bill.billDate || bill.billMonth || "-"}
                                                    </td>
                                                    <td className="border border-neutral-300 px-4 py-3 text-center text-sm font-bold text-neutral-900">
                                                        <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-700 rounded border border-neutral-300">
                                                            {bill.billNumber}
                                                        </span>
                                                    </td>
                                                    <td className="border border-neutral-300 px-4 py-3 text-center text-sm text-neutral-700">
                                                        {bill.vendorName}
                                                    </td>
                                                    <td className="border border-neutral-300 px-4 py-3 text-center text-sm text-neutral-700">
                                                        {bill.billToName}
                                                    </td>
                                                    <td className="border border-neutral-300 px-4 py-3 text-center text-sm font-bold text-neutral-900">
                                                        ₹{bill.grandTotal?.toFixed(2) || "0.00"}
                                                    </td>
                                                    <td className="border border-neutral-300 px-4 py-3 text-center text-sm">
                                                        <div className="flex gap-2 items-center justify-center flex-wrap">
                                                            <button
                                                                onClick={() =>
                                                                    navigate(`/bills/${bill.billNumber}`)
                                                                }
                                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                                title="View"
                                                            >
                                                                <AiOutlineEye size={16} />
                                                            </button>
                                                            {(role === "manager" || role === "admin") && (
                                                                <>
                                                                    <button
                                                                        onClick={() =>
                                                                            navigate(`/bills/edit/${bill.billNumber}`)
                                                                        }
                                                                        className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all duration-200"
                                                                        title="Review and Update"
                                                                    >
                                                                        <AiOutlineEdit size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteClick(bill.billNumber)}
                                                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                                        title="Delete"
                                                                    >
                                                                        <AiOutlineDelete size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                                            {totalPages > 1 && (
                                                            <div className="border-t border-neutral-300 bg-neutral-50 mt-4">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <div className="mb-4 flex justify-center">
                                    <div className="p-4 bg-neutral-100 rounded-full">
                                        <FaFileInvoice className="h-12 w-12 text-blue-500" />
                                    </div>
                                </div>
                                <p className="text-neutral-600 font-semibold text-lg">No bills found</p>
                                <p className="text-neutral-500 text-sm mt-1">Try adjusting your search or create a new bill</p>
                                {(role === "manager" || role === "admin") && (
                                    <Button
                                        onClick={() => navigate("/bills/create")}
                                        className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md transition-all duration-300"
                                    >
                                        <FaPlus className="h-4 w-4 mr-2" />
                                        Create First Bill
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                    </Card>
                    </div>
                    </div>

                    {/* Delete Confirmation Modal */}
                    <Dialog open={deleteModal.isOpen} onOpenChange={handleDeleteCancel}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Bill</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this bill? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDeleteCancel}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BillsPage;
