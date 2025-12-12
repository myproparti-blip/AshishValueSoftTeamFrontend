import React, { useRef } from "react";
import { 
    FaMapMarkerAlt, 
    FaImage, 
    FaLocationArrow, 
    FaUpload, 
    FaFileAlt 
} from "react-icons/fa";
import { 
    Button, 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    Input, 
    Label, 
    Textarea 
} from "./ui";

const DocumentsPanel = ({
    formData,
    canEdit,
    locationImagePreviews,
    imagePreviews,
    handleLocationImageUpload,
    handleImageUpload,
    removeLocationImage,
    removeImage,
    handleInputChange,
    handleCoordinateChange,
    setFormData,
    locationFileInputRef,
    fileInputRef1,
    fileInputRef2,
    fileInputRef3,
    fileInputRef4
}) => {
    return (
        <>
            {/* Location Images Section */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaMapMarkerAlt className="h-5 w-5 text-orange-600" />
                    Location Images & Coordinates
                </h3>
                <div className="space-y-6">

                    {/* Location Images Upload */}
                    <Card className="border">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <FaImage className="h-5 w-5" />
                                Location Images
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <input
                                    type="file"
                                    ref={locationFileInputRef}
                                    accept="image/*"
                                    onChange={handleLocationImageUpload}
                                    style={{ display: 'none' }}
                                    disabled={!canEdit}
                                />
                                <Button
                                    type="button"
                                    onClick={() => locationFileInputRef.current?.click()}
                                    className="flex items-center gap-2"
                                    disabled={!canEdit}
                                >
                                    <FaUpload className="h-4 w-4" />
                                    Upload Location Images
                                </Button>

                                {/* Location Image Preview - Single Image Only */}
                                {locationImagePreviews.length > 0 && (
                                    <Card className="relative w-32 h-32 border-2 border-dashed">
                                        <CardContent className="p-0 h-full">
                                            <img
                                                src={locationImagePreviews[0].preview}
                                                alt="Location Preview"
                                                className="w-full h-full object-cover rounded"
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => removeLocationImage(0)}
                                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                                                variant="destructive"
                                                size="sm"
                                                disabled={!canEdit}
                                            >
                                                ×
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coordinates Card */}
                    <Card className="border">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <FaLocationArrow className="h-5 w-5" />
                                GPS Coordinates
                                {formData.coordinates.latitude && formData.coordinates.longitude && " (from image metadata)"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {/* Coordinate Input Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Latitude</Label>
                                        <Input
                                            placeholder="Enter latitude"
                                            value={formData.coordinates.latitude || ''}
                                            onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                                            className="mt-2"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Longitude</Label>
                                        <Input
                                            placeholder="Enter longitude"
                                            value={formData.coordinates.longitude || ''}
                                            onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                                            className="mt-2"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="border-t-2 border-gray-200"></div>

            {/* Property Images Section */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaUpload className="h-5 w-5 text-orange-600" />
                    Property Images
                </h3>
                <p className="text-sm text-gray-600 mb-4">Upload property images - 4 separate upload options</p>
                <div className="space-y-6">

                    {/* 4 Upload Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((num) => {
                            const roomNames = { 1: 'Kitchen', 2: 'Hall', 3: 'Bedroom', 4: 'Elevation' };
                            const refMap = {
                                1: fileInputRef1,
                                2: fileInputRef2,
                                3: fileInputRef3,
                                4: fileInputRef4
                            };
                            return (
                                <Card key={num} className="border-2 border-dashed transition-all cursor-pointer">
                                    <CardContent className="p-6 flex flex-col items-center justify-center min-h-[140px]">
                                        <input
                                            type="file"
                                            ref={refMap[num]}
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, num)}
                                            style={{ display: 'none' }}
                                            disabled={!canEdit}
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => refMap[num].current?.click()}
                                            variant="outline"
                                            className="flex items-center gap-2 w-full h-full min-h-[100px] border-2 border-dashed"
                                            disabled={!canEdit}
                                        >
                                            <div className="text-center">
                                                <FaUpload className="h-8 w-8 mb-2 mx-auto" />
                                                <div className="text-sm font-medium">Upload {roomNames[num]} Images</div>
                                            </div>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Combined Image Previews */}
                    {imagePreviews.length > 0 && (
                        <Card className="border">
                            <CardHeader className="border-b">
                                <CardTitle>
                                    Uploaded Images ({imagePreviews.length} images)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <Card key={index} className="relative border border-gray-200 shadow-sm">
                                            <CardContent className="p-0">
                                                <img
                                                    src={preview.preview}
                                                    alt={`Property Preview ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-t-lg"
                                                />
                                                <div className="p-3 rounded-b-lg">
                                                    <div className="text-xs flex justify-between">
                                                        <span>Option {preview.inputNumber}</span>
                                                        <span>{preview.file ? Math.round(preview.file.size / 1024) : ''}KB</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 bg-red-500 hover:bg-red-600"
                                                    size="sm"
                                                    disabled={!canEdit}
                                                >
                                                    ×
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Notes Section */}
            <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaFileAlt className="h-5 w-5 text-orange-600" />
                    Additional Notes
                </h3>
                <div className="space-y-2">
                    <Textarea
                        placeholder="Enter any additional notes or comments..."
                        name="notes"
                        value={formData.notes || ""}
                        onChange={handleInputChange}
                        disabled={!canEdit}
                        rows={4}
                        className="rounded-xl border-2 border-orange-300 focus:border-orange-500 focus:ring-orange-200 font-medium"
                    />
                </div>
            </div>
        </>
    );
};

export default DocumentsPanel;