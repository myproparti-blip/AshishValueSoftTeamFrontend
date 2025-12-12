import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBillById } from "../services/billService";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { FaFileInvoice, FaArrowLeft, FaPrint } from "react-icons/fa";

const BillDetailPage = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const role = user?.role || "";
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        loadBill();
    }, [id]);

    const loadBill = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getBillById(id);
            if (response.success) {
                setBill(response.data);
            } else {
                setError(response.message || "Error loading bill");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error loading bill");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block p-3 bg-neutral-100 rounded-full mb-4">
                        <FaFileInvoice className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-neutral-600 font-semibold">Loading bill...</p>
                </div>
            </div>
        );
    }

    const ErrorState = ({ message }) => (
        <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/bills")}
                        className="h-9 w-9 border border-neutral-300 hover:bg-neutral-100 hover:border-blue-400 rounded-lg p-0 transition-colors"
                    >
                        <FaArrowLeft className="h-4 w-4 text-neutral-700" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Bill Details</h1>
                        <p className="text-xs text-neutral-500 mt-1">View bill information</p>
                    </div>
                </div>
                {message && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg mb-6 shadow-sm">
                        <p className="font-semibold">Error</p>
                        <p className="text-sm mt-1">{message}</p>
                    </div>
                )}
            </div>
        </div>
    );

    if (error) {
        return <ErrorState message={error} />;
    }

    if (!bill) {
        return (
            <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
                <div className="max-w-7xl mx-auto flex flex-col gap-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate("/bills")}
                            className="h-9 w-9 border border-neutral-300 hover:bg-neutral-100 hover:border-blue-400 rounded-lg p-0 transition-colors"
                        >
                            <FaArrowLeft className="h-4 w-4 text-neutral-700" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Bill Details</h1>
                            <p className="text-xs text-neutral-500 mt-1">View bill information</p>
                        </div>
                    </div>
                    <div className="text-center py-16">
                        <div className="mb-4 flex justify-center">
                            <div className="p-4 bg-neutral-100 rounded-full">
                                <FaFileInvoice className="h-12 w-12 text-blue-500" />
                            </div>
                        </div>
                        <p className="text-neutral-600 font-semibold text-lg">Bill not found</p>
                        <Button onClick={() => navigate("/bills")} className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md transition-all duration-300">
                            <FaArrowLeft className="h-4 w-4 mr-2" />
                            Back to Bills
                        </Button>
                    </div>
                </div>
            </div>
        );
    }



    const totalItems = bill.items?.length || 0;
    const totalAmount = bill.totalAmount || 0;
    const totalGst = bill.totalGst || 0;
    const grandTotal = bill.grandTotal || 0;

    return (
        <div className="min-h-screen bg-neutral-50 p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/bills")}
                    className="h-9 w-9 border border-neutral-300 hover:bg-neutral-100 hover:border-blue-400 rounded-lg p-0 transition-colors"
                >
                    <FaArrowLeft className="h-4 w-4 text-neutral-700" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Bill Details</h1>
                    <p className="text-xs text-neutral-500 mt-1">Bill No. {bill.billNumber}</p>
                </div>
                <Button
                    onClick={handlePrint}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md transition-all duration-300"
                >
                    <FaPrint className="h-4 w-4 mr-2" />
                    Print / PDF
                </Button>
            </div>

            {/* Main Content - 2-Column Layout (Full Height Optimized) */}
            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
                {/* Left Column - Bill Summary */}
                <div className="col-span-12 sm:col-span-3 lg:col-span-2">
                    <Card className="border border-neutral-200 bg-white rounded-lg overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-neutral-900">
                                <FaFileInvoice className="h-4 w-4 text-blue-500" />
                                Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 overflow-y-auto flex-1">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Bill Number</p>
                                <p className="text-sm font-medium text-neutral-900">{bill.billNumber}</p>
                            </div>
                            <div className="border-t border-neutral-200"></div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Bill Month</p>
                                <p className="text-sm font-medium text-neutral-900">{bill.billMonth}</p>
                            </div>
                            <div className="border-t border-neutral-200"></div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Bill Date</p>
                                <p className="text-sm font-medium text-neutral-900">{bill.billDate}</p>
                            </div>
                            <div className="border-t border-neutral-200"></div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Grand Total</p>
                                <p className="text-lg font-bold text-blue-600">₹{grandTotal?.toFixed(2) || "0.00"}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Invoice Details */}
                <div className="col-span-12 sm:col-span-9 lg:col-span-10">
                    <Card className="border border-neutral-200 shadow-sm bg-white rounded-lg overflow-hidden h-full flex flex-col">
                        <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <FaFileInvoice className="h-4 w-4 text-blue-500" />
                                Invoice Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 overflow-y-auto flex-1">
                            {/* Invoice Header */}
                            <div className="border-b-2 pb-6 mb-6">
                                <h2 className="text-3xl font-bold text-neutral-900">TAX INVOICE</h2>
                            </div>

                            <div className="grid grid-cols-3 gap-6 mb-8">
                                {/* Vendor Details */}
                                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                    <h3 className="font-bold text-sm mb-3 text-neutral-900 flex items-center gap-2">
                                        <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                                        VENDOR DETAILS
                                    </h3>
                                    <p className="font-bold text-neutral-900 mb-2">{bill.vendorName}</p>
                                    <p className="text-sm whitespace-pre-wrap text-neutral-700 mb-2">
                                        {bill.vendorAddress}
                                    </p>
                                    {bill.vendorPan && (
                                        <p className="text-xs mt-2 text-neutral-700">
                                            <strong className="font-semibold">PAN:</strong> <span className="font-mono text-neutral-800">{bill.vendorPan}</span>
                                        </p>
                                    )}
                                    {bill.vendorGst && (
                                        <p className="text-xs text-neutral-700">
                                            <strong className="font-semibold">GST:</strong> <span className="font-mono text-neutral-800">{bill.vendorGst}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Bill Info */}
                                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">Bill Number</p>
                                        <p className="font-bold text-neutral-900 text-lg mt-1">{bill.billNumber}</p>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">Bill Month</p>
                                        <p className="font-semibold text-neutral-800 mt-1">{bill.billMonth}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">Bill Date</p>
                                        <p className="font-semibold text-neutral-800 mt-1">{bill.billDate}</p>
                                    </div>
                                </div>

                                {/* Bill To Details */}
                                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                    <h3 className="font-bold text-sm mb-3 text-neutral-900 flex items-center gap-2">
                                        <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                                        BILL TO (RECEIVER)
                                    </h3>
                                    <p className="font-bold text-neutral-900 mb-2">{bill.billToName}</p>
                                    <p className="text-sm whitespace-pre-wrap text-neutral-700 mb-2">
                                        {bill.billToAddress}
                                    </p>
                                    {bill.billToGstin && (
                                        <p className="text-xs mt-2 text-neutral-700">
                                            <strong className="font-semibold">GSTIN:</strong> <span className="font-mono text-neutral-800">{bill.billToGstin}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-8">
                                <h3 className="font-bold mb-4 text-neutral-900 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                    PARTICULARS
                                </h3>
                                <table className="w-full border border-neutral-300">
                                    <thead>
                                        <tr className="bg-neutral-100 border-b border-neutral-300">
                                            <th className="border border-neutral-300 px-4 py-3 text-left text-sm font-bold text-neutral-900">
                                                Particulars
                                            </th>
                                            <th className="border border-neutral-300 px-4 py-3 text-left text-sm font-bold text-neutral-900">
                                                HSN/SAC
                                            </th>
                                            <th className="border border-neutral-300 px-4 py-3 text-right text-sm font-bold text-neutral-900">
                                                Amount
                                            </th>
                                            <th className="border border-neutral-300 px-4 py-3 text-right text-sm font-bold text-neutral-900">
                                                GST %
                                            </th>
                                            <th className="border border-neutral-300 px-4 py-3 text-right text-sm font-bold text-neutral-900">
                                                CGST
                                            </th>
                                            <th className="border border-neutral-300 px-4 py-3 text-right text-sm font-bold text-neutral-900">
                                                SGST
                                            </th>
                                            <th className="border border-neutral-300 px-4 py-3 text-right text-sm font-bold text-neutral-900">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bill.items?.map((item, index) => (
                                            <tr key={index} className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors duration-200">
                                                <td className="border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700">
                                                    {item.particulars}
                                                </td>
                                                <td className="border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700">{item.hsn}</td>
                                                <td className="border border-neutral-300 px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                                                    ₹{item.amount?.toFixed(2) || "0.00"}
                                                </td>
                                                <td className="border border-neutral-300 px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                                                    {item.gstRate}%
                                                </td>
                                                <td className="border border-neutral-300 px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                                                    ₹{item.cgst?.toFixed(2) || "0.00"}
                                                </td>
                                                <td className="border border-neutral-300 px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                                                    ₹{item.sgst?.toFixed(2) || "0.00"}
                                                </td>
                                                <td className="border border-neutral-300 px-4 py-3 text-right text-sm font-bold text-blue-600">
                                                    ₹{item.itemTotal?.toFixed(2) || "0.00"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tax Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Left side - empty for layout */}
                                <div></div>

                                {/* Tax Summary Table */}
                                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                    <h3 className="font-bold mb-4 text-neutral-900 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                        TAX SUMMARY
                                    </h3>
                                    <table className="w-full">
                                        <tbody>
                                            <tr className="border-b border-neutral-200">
                                                <td className="px-4 py-3 text-sm font-semibold text-neutral-700">
                                                    Total Amount
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                                                    ₹{totalAmount?.toFixed(2) || "0.00"}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-neutral-200">
                                                <td className="px-4 py-3 text-sm font-semibold text-neutral-700">
                                                    CGST (9%)
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                                                    ₹{(bill.totalCgst || 0)?.toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-neutral-200">
                                                <td className="px-4 py-3 text-sm font-semibold text-neutral-700">
                                                    SGST (9%)
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                                                    ₹{(bill.totalSgst || 0)?.toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-neutral-200">
                                                <td className="px-4 py-3 text-sm font-semibold text-neutral-700">
                                                    IGST (18%)
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                                                    ₹{(bill.totalIgst || 0)?.toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr className="bg-blue-500">
                                                <td className="px-4 py-3 text-sm font-bold text-white">GRAND TOTAL</td>
                                                <td className="px-4 py-3 text-right text-lg font-bold text-white">
                                                    ₹{grandTotal?.toFixed(2) || "0.00"}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Bank Details */}
                            {bill.bankDetails?.bankName && (
                                <div className="border-t pt-6 mb-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                    <h3 className="font-bold mb-4 text-neutral-900 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                        BANK DETAILS
                                    </h3>
                                    <table className="text-sm w-full">
                                        <tbody>
                                            {bill.bankDetails?.beneficiary && (
                                                <tr className="border-b border-neutral-200">
                                                    <td className="font-semibold pr-4 py-2 text-neutral-700">Beneficiary</td>
                                                    <td className="py-2 text-neutral-700">{bill.bankDetails.beneficiary}</td>
                                                </tr>
                                            )}
                                            {bill.bankDetails?.bankName && (
                                                <tr className="border-b border-neutral-200">
                                                    <td className="font-semibold pr-4 py-2 text-neutral-700">Bank Name</td>
                                                    <td className="py-2 text-neutral-700">{bill.bankDetails.bankName}</td>
                                                </tr>
                                            )}
                                            {bill.bankDetails?.accountNo && (
                                                <tr className="border-b border-neutral-200">
                                                    <td className="font-semibold pr-4 py-2 text-neutral-700">Account No.</td>
                                                    <td className="py-2 text-neutral-700 font-mono">{bill.bankDetails.accountNo}</td>
                                                </tr>
                                            )}
                                            {bill.bankDetails?.ifscCode && (
                                                <tr>
                                                    <td className="font-semibold pr-4 py-2 text-neutral-700">IFSC Code</td>
                                                    <td className="py-2 text-neutral-700 font-mono">{bill.bankDetails.ifscCode}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Declaration */}
                            {bill.declaration && (
                                <div className="border-t pt-6 mb-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                    <p className="text-sm italic text-neutral-700 font-semibold">
                                        <strong className="text-neutral-900">Declaration:</strong> {bill.declaration}
                                    </p>
                                </div>
                            )}

                            {/* Signature Section */}
                            <div className="border-t pt-6 grid grid-cols-3 gap-8 mt-8">
                                <div></div>
                                <div></div>
                                <div className="text-center">
                                    <div className="border-t-2 border-black pt-2 mb-2">
                                        Seal & Signature
                                    </div>
                                    {bill.signerName && (
                                        <p className="text-sm font-semibold">{bill.signerName}</p>
                                    )}
                                    {bill.place && <p className="text-xs text-gray-600">{bill.place}</p>}
                                    {bill.signatureDate && (
                                        <p className="text-xs text-gray-600">{bill.signatureDate}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:border-0 {
            border: 0;
          }
        }
      `}</style>
        </div>
    );
};

export default BillDetailPage;
