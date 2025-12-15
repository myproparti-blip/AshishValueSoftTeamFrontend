import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import exifr from 'exifr';
import { getFormRouteForBank, isBofMaharashtraBank } from "../config/bankFormMapping";
import {
    FaArrowLeft,
    FaMapMarkerAlt,
    FaUpload,
    FaPrint,
    FaDownload,
    FaUser,
    FaFileAlt,
    FaCog,
    FaCompass,
    FaBuilding,
    FaImage,
    FaLocationArrow,
    FaCheckCircle,
    FaTimesCircle,
    FaSave,
    FaThumbsUp,
    FaThumbsDown,
    FaRedo
} from "react-icons/fa";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea, Label, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, RadioGroup, RadioGroupItem, ChipSelect } from "../components/ui";
import { getUbiApfFormById, updateUbiApfForm, managerSubmitUbiApfForm, requestReworkUbiApfForm } from "../services/ubiApfService";
import { showLoader, hideLoader } from "../redux/slices/loaderSlice";
import { useNotification } from "../context/NotificationContext";
import { uploadPropertyImages, uploadLocationImages, uploadDocuments } from "../services/imageService";
import { invalidateCache } from "../services/axios";
import { getCustomOptions } from "../services/customOptionsService";
import ClientInfoPanel from "../components/ClientInfoPanel";
import DocumentsPanel from "../components/DocumentsPanel";
import { generateRecordPDFOffline } from "../services/ubiShopPdf";

const UbiApfEditForm = ({ user, onLogin }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [valuation, setValuation] = useState(null);
    const isLoggedIn = !!user;
    const [bankName, setBankName] = useState("");
    const [city, setCity] = useState("");
    const [dsa, setDsa] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null);
    const [modalFeedback, setModalFeedback] = useState("");
    const [activeTab, setActiveTab] = useState("client");
    const [activeValuationSubTab, setActiveValuationSubTab] = useState("general");
    const { showSuccess, showError } = useNotification();
    const [formData, setFormData] = useState({
        // BASIC INFO
        uniqueId: '',
        username: '',
        dateTime: '',
        day: '',

        // BANK & CITY
        bankName: '',
        city: '',

        // CLIENT DETAILS
        clientName: '',
        mobileNumber: '',
        address: '',

        // PAYMENT
        payment: '',
        collectedBy: '',

        // DSA
        dsa: '',
        customDsa: '',

        // ENGINEER
        engineerName: '',
        customEngineerName: '',

        // NOTES
        notes: '',

        // PROPERTY BASIC DETAILS
        elevation: '',
        // DIRECTIONS
        directions: {
            north1: '',
            east1: '',
            south1: '',
            west1: '',
            north2: '',
            east2: '',
            south2: '',
            west2: ''
        },

        // COORDINATES
        coordinates: {
            latitude: '',
            longitude: ''
        },

        // IMAGES
        propertyImages: [],
        locationImages: [],
        documentPreviews: [],
        photos: {
            elevationImages: [],
            siteImages: []
        },

        // STATUS
        status: 'pending',
        managerFeedback: '',
        submittedByManager: false,
        lastUpdatedBy: '',
        lastUpdatedByRole: '',

        // PDF DETAILS (AUTO-EXTRACTED)
        pdfDetails: {
            formId: '',
            branch: '',
            valuationPurpose: '',
            inspectionDate: '',
            valuationMadeDate: '',

            mortgageDeed: '',
            mortgageDeedBetween: '',
            previousValuationReport: '',
            previousValuationInFavorOf: '',
            approvedPlanNo: '',

            // GENERAL SECTION - DOCUMENTS
            purposeOfValuation: '',
            dateOfInspection: '',
            dateOfValuationMade: '',
            agreementForSale: '',
            commencementCertificate: '',
            occupancyCertificate: '',
            ownerNameAddress: '',
            briefDescriptionProperty: '',

            ownerName: '',

            // PROPERTY DESCRIPTION / LOCATION OF PROPERTY
            plotSurveyNo: '',
            doorNo: '',
            tpVillage: '',
            wardTaluka: '',
            mandalDistrict: '',
            layoutPlanIssueDate: '',
            approvedMapAuthority: '',
            authenticityVerified: '',
            valuerCommentOnAuthenticity: '',
            otherApprovedPlanDetails: '',
            valuesApprovedPlan: '',

            postalAddress: '',
            cityTown: '',
            residentialArea: false,
            commercialArea: false,
            industrialArea: false,
            locationOfProperty: '',

            // INDUSTRIAL AREA DETAILS - Section 9
            areaClassification: '',
            urbanClassification: '',
            governmentType: '',
            govtEnactmentsCovered: '',

            // BOUNDARIES OF PROPERTY - Section 12
            boundariesPlotNorthDeed: '',
            boundariesPlotNorthActual: '',
            boundariesPlotSouthDeed: '',
            boundariesPlotSouthActual: '',
            boundariesPlotEastDeed: '',
            boundariesPlotEastActual: '',
            boundariesPlotWestDeed: '',
            boundariesPlotWestActual: '',
            boundariesShopNorthDeed: '',
            boundariesShopNorthActual: '',
            boundariesShopSouthDeed: '',
            boundariesShopSouthActual: '',
            boundariesShopEastDeed: '',
            boundariesShopEastActual: '',
            boundariesShopWestDeed: '',
            boundariesShopWestActual: '',

            // DIMENSIONS OF THE UNIT - Section 13
            dimensionsDeed: '',
            dimensionsActual: '',

            // EXTENT OF THE UNIT - Section 14
            extentOfUnit: '',
            latitudeLongitude: '',
            floorSpaceIndex: '',

            // EXTENT OF SITE CONSIDERED FOR VALUATION - Section 15
            extentOfSiteValuation: '',

            // MISSING VALUATION FIELDS FROM GENERAL TAB
            listOfDocumentsProduced: '',
            valuerCommentOnAuthenticity: '',

            // SECTION 16 - OCCUPANCY
            rentReceivedPerMonth: '',

            // APARTMENT BUILDING DETAILS - Section II
            apartmentNature: '',
            apartmentLocation: '',
            apartmentCTSNo: '',
            apartmentSectorNo: '',
            apartmentBlockNo: '',
            apartmentWardNo: '',
            apartmentVillageMunicipalityCounty: '',
            apartmentDoorNoStreetRoad: '',
            apartmentPinCode: '',

            // APARTMENT BUILDING SUBSECTIONS
            descriptionOfLocalityResidentialCommercialMixed: '',
            yearOfConstruction: '',
            numberOfFloors: '',
            typeOfStructure: '',
            numberOfDwellingUnitsInBuilding: '',
            qualityOfConstruction: '',
            appearanceOfBuilding: '',
            maintenanceOfBuilding: '',

            // VALUE OF FLAT - SECTION C
            fairMarketValue: '',
            realizableValue: '',
            distressValue: '',
            saleDeedValue: '',
            agreementCircleRate: '',
            agreementValue: '',
            valueCircleRate: '',
            insurableValue: '',
            totalJantriValue: '',

            // FLAT SPECIFICATIONS EXTENDED
            areaUsage: '',
            carpetAreaFlat: '',

            // MONTHLY RENT
            ownerOccupancyStatus: '',
            monthlyRent: '',

            // MARKETABILITY SECTION
            marketability: '',
            favoringFactors: '',
            negativeFactors: '',

            // RATE SECTION
            comparableRate: '',
            adoptedBasicCompositeRate: '',
            buildingServicesRate: '',
            landOthersRate: '',
            guidelineRate: '',

            // COMPOSITE RATE AFTER DEPRECIATION
            depreciatedBuildingRate: '',
            replacementCostServices: '',
            buildingAge: '',
            buildingLife: '',
            depreciationPercentage: '',
            deprecatedRatio: '',

            // MARKET RATE ANALYSIS
            marketabilityDescription: '',
            smallFlatDescription: '',
            newConstructionArea: '',
            rateAdjustments: '',

            // BREAK-UP FOR THE ABOVE RATE
            goodwillRate: '',

            // COMPOSITE RATE AFTER DEPRECIATION (LEGACY)
            depreciationBuildingDate: '',
            depreciationStorage: '',

            // TOTAL COMPOSITE RATE
            totalCompositeRate: '',
            rateForLandOther: '',

            // VALUATION DETAILS - Items (Qty, Rate, Value rows)
            presentValueQty: '',
            presentValueRate: '',
            presentValue: '',
            wardrobesQty: '',
            wardrobesRate: '',
            wardrobes: '',
            showcasesQty: '',
            showcasesRate: '',
            showcases: '',
            kitchenArrangementsQty: '',
            kitchenArrangementsRate: '',
            kitchenArrangements: '',
            superfineFinishQty: '',
            superfineFinishRate: '',
            superfineFinish: '',
            interiorDecorationsQty: '',
            interiorDecorationsRate: '',
            interiorDecorations: '',
            electricityDepositsQty: '',
            electricityDepositsRate: '',
            electricityDeposits: '',
            collapsibleGatesQty: '',
            collapsibleGatesRate: '',
            collapsibleGates: '',
            potentialValueQty: '',
            potentialValueRate: '',
            potentialValue: '',
            otherItemsQty: '',
            otherItemsRate: '',
            otherItems: '',
            totalValuationItems: '',

            // SECTION 3: FLAT/UNIT SPECIFICATIONS
            unitFloor: '',
            unitDoorNo: '',
            unitRoof: '',
            unitFlooring: '',
            unitDoors: '',
            unitBathAndWC: '',
            unitElectricalWiring: '',
            unitSpecification: '',
            unitFittings: '',
            unitFinishing: '',

            // SECTION 4: UNIT TAX/ASSESSMENT
            assessmentNo: '',
            taxPaidName: '',
            taxAmount: '',

            // SECTION 5: ELECTRICITY SERVICE
            electricityServiceNo: '',
            meterCardName: '',

            // SECTION 6: UNIT MAINTENANCE
            unitMaintenance: '',

            // SECTION 7: AGREEMENT FOR SALE
            agreementSaleExecutedName: '',

            // SECTION 8 & 9: UNIT AREA DETAILS
            undividedAreaLand: '',
            plinthArea: '',
            carpetArea: '',

            // SECTION 10-14: UNIT CLASSIFICATION
            classificationPosh: '',
            classificationUsage: '',
            classificationOwnership: '',

            // SIGNATURE & REPORT DETAILS
            place: '',
            signatureDate: '',
            signerName: '',
            reportDate: '',
            fairMarketValueWords: '',

            // FACILITIES AVAILABLE
            liftAvailable: '',
            protectedWaterSupply: '',
            undergroundSewerage: '',
            carParkingOpenCovered: '',
            isCompoundWallExisting: '',
            isPavementLaidAroundBuilding: '',
            othersFacility: '',

            // DECLARATIONS
            declarationB: '',
            declarationD: '',
            declarationE: '',
            declarationI: '',
            declarationJ: '',

            // VALUATION INFORMATION DETAILS
            assetBackgroundInfo: '',
            valuationPurposeAuthority: '',
            valuersIdentity: '',
            valuersConflictDisclosure: '',
            dateOfAppointment: '',
            inspectionsUndertaken: '',
            informationSources: '',
            valuationProcedures: '',
            reportRestrictions: '',
            majorFactors: '',
            additionalFactors: '',
            caveatsLimitations: '',

            // PROPERTY DETAILS (EXTENDED)
            briefDescriptionOfProperty: '',
            locationOfProperty: '',
            plotNo: '',
            surveyNo: '',
            taluka: '',
            mandal: '',
            district: '',
            residentialArea: '',
            commercialArea: '',
            industrialArea: '',
            classificationOfArea: '',
            height: '',
            urbanRural: '',
            mileSemUrban: '',
            municipalCorporationAsPer: '',

            // BOUNDARY & DIMENSIONS (EXTENDED)
            boundariesOfTheProperty: '',
            northBoundary: '',
            southBoundary: '',
            eastBoundary: '',
            westBoundary: '',

            // LAYOUT & MEASUREMENTS
            plotLayoutNo: '',
            sNo41: '',
            sNo42: '',
            sNo9: '',
            asPerDeedNo: '',
            asPerDeedArea: '',

            // CONSTRUCTION DETAILS
            constructionAsPer: '',
            panchayatMunicipalitySearchReport: '',
            watercoveredUnderSaleDeeds: '',
            governmentEnctmentsOrUtilitiesScheduledArea: '',

            // APPROVAL & VALIDITY
            dateIssueAndValidityOfApprovedPlan: '',
            whetherGenerousOnAuthority: '',
            anyOtherCommentsOrAuthorityApprovedPlan: '',

            // BUILDING CONSTRUCTION INFO
            buildingConsistenceAs: '',
            greyWordCompleted: '',
            mrDwyingUnderwaiting: '',
            approvedPlaneAssembly: '',

            // BUILDING SPECIFICATIONS
            buildingPlan: '',
            groundFloorArea: '',
            approvedPlan: '',

            // VALUATION REPORT DETAILS
            purposeForValuation: '',
            dateOnWhichValuationIsMade: '',
            listOfDocumentsProducedForPerusal: '',
            protocolDocuments: '',

            // SANCTIONED PLAN
            sanctionedPlanStatus: '',
            certificateNumber: '',

            // BUILDING COMPLETION
            buildingCompletionCertificate: '',
            completionCertificateNo: '',
            ownerAddressJointOwners: '',
            jointOwnersDeDetailsOfJointOwnership: '',

            // APARTMENT BUILDING SECTION (Extended)
            classificationOfLocality: '',
            developmentOfSurroundingAreas: '',
            possibilityOfFutureHousingMixing: '',
            feasibilityOf1To2Kms: '',
            typeOfStructureMaterial: '',
            shareOfLand: '',
            typeOfUseToWhichItCanBePut: '',
            anyUsageRestriction: '',
            isPlotInTownPlanning: '',
            cornerPlotOrInteriorFacilities: '',
            yearOfRoadAvailability: '',
            waterRoadAvailableBelowOrAbove: '',
            isALandArea: '',
            waterSewerageSystem: '',

            // VALUATION DETAILS (EXTENDED)
            assessedOrAdoptedRateForValuation: '',
            estimatedRuleOfLand: '',
            technicalDetailsOfBuilding: '',
            typeOfBuildingVenture: '',
            typeOfConstructionLandCeiling: '',
            typeOfPropertyVenture: '',
            yearOfProperty: '',
            residualUseOfBuildingEstimated: '',
            carpetAreaMeasurementDetails: '',

            // PLOT & AREA DETAILS (EXTENDED)
            plotAreaNorth: '',
            plotAreaSouth: '',
            plotAreaEast: '',
            plotAreaWest: '',
            extentOfArea: '',
            technicalDetailsOfStructure: '',
            typeOfConstructionFrame: '',

            // FLOOR AREA DETAILS
            groundFloorAreaBuiltUp: '',
            firstFloor: '',
            secondFloor: '',
            thirdFloor: '',
            fourthFloor: '',
            fifthFloor: '',
            sixthFloor: '',
            seventhFloor: '',
            eighthFloor: '',
            ninthFloor: '',
            tenthFloor: '',
            basementFloor: '',
            totalCarpetArea: '',

            // CONSTRUCTION SPECIFICATIONS
            finishingWorkInProgress: '',
            buildingPlanStructured: '',
            dateIssueAndValidityOfLayout: '',
            approvalAuthority: '',
            weatherGenuinessOrAuthenticity: '',
            anyOtherComments: '',
            specificationConstructionFloorSlab: '',
            foundationDescription: '',
            basementDescription: '',
            superstructureDescription: '',
            entranceDoor: '',
            otherDoor: '',
            windows: '',
            flooringShirtingDetails: '',
            specialFinish: '',
            roofingWeatherproofCourse: '',
            drainage: '',
            damp: '',
            rccFrameOrRccSlab: '',
            proposedETPPlantPerPCBNorms: '',

            // PLOT CONSTRUCTION & LAYOUT DETAILS
            compoundwall: '',
            length: '',
            typeOfConstruction: '',
            electricalInstallationPlot: '',
            typeOfWiringPlot: '',
            numberOfFittingPoints: '',
            farPlugsPlot: '',
            sparePlugPlot: '',
            anyOtherItemPlot: '',
            printingInstallation: '',
            numberOfWaterClassAndTapsPlot: '',
            noWashBasinsPlot: '',
            noUrinalsPlot: '',
            noOfBathtubsPlot: '',
            waterMeterTapsPlot: '',
            anyOtherFixturePlot: '',

            // ORNAMENTAL & AMENITIES DETAILS
            ornamentalFloor: '',
            ornamentalFloorAmount: '',
            stuccoVeranda: '',
            stuccoVerandaAmount: '',
            sheetGrills: '',
            sheetGrillsAmount: '',
            overheadWaterTank: '',
            overheadWaterTankAmount: '',
            extraShedPossibleGates: '',
            extraShedPossibleGatesAmount: '',
            ornamentalTotal: '',

            // PART C - AMENITIES
            partCAmenities1Description: '',
            partCAmenities1AmountInRupees: '',
            partCAmenities2Description: '',
            partCAmenities2AmountInRupees: '',
            partCAmenities3Description: '',
            partCAmenities3AmountInRupees: '',
            partCAmenities4Description: '',
            partCAmenities4AmountInRupees: '',
            partCAmenitiesTotal: '',

            // PART D - WORKBEDS
            partDWorkbeds1Description: '',
            partDWorkbeds1AmountInRupees: '',
            partDWorkbeds2Description: '',
            partDWorkbeds2AmountInRupees: '',
            partDWorkbeds3Description: '',
            partDWorkbeds3AmountInRupees: '',
            partDWorkbeds4Description: '',
            partDWorkbeds4AmountInRupees: '',
            partDWorbedsTotal: '',

            // AMENITIES DETAILED ITEMS
            amenitiesGlazedTubAndBed: '',
            amenitiesGlazedTubAndBedAmount: '',
            amenitiesExteriorStudAndBed: '',
            amenitiesExteriorStudAndBedAmount: '',
            amenitiesMaritalCeiling: '',
            amenitiesMaritalCeilingAmount: '',

            // PART E - MISCELLANEOUS
            partEMiscellaneous1Description: '',
            partEMiscellaneous1AmountInRupees: '',
            partEMiscellaneous2Description: '',
            partEMiscellaneous2AmountInRupees: '',
            partEMiscellaneous3Description: '',
            partEMiscellaneous3AmountInRupees: '',
            partEMiscellaneous4Description: '',
            partEMiscellaneous4AmountInRupees: '',
            partEMiscellaneousTotal: '',

            // MISCELLANEOUS ITEMS
            miscellaneousSeparateToiletRoom: '',
            miscellaneousSeparateToiletRoomAmount: '',
            miscellaneousSeparateLumberRoom: '',
            miscellaneousSeparateLumberRoomAmount: '',
            miscellaneousSeparateWaterTankSump: '',
            miscellaneousSeparateWaterTankSumpAmount: '',
            miscellaneousTreesGardening: '',
            miscellaneousTreesGardeningAmount: '',

            // BUILDING VALUATION DETAILS
            estimatedRepairCostOfConstruction: '',
            rateOfConstruction: '',
            buildUpAreaInSqft: '',
            groundFloorSqft: '',
            groundFloorRateOfConstruction: '',
            groundFloorValueOfConstruction: '',
            secondFloorSqft: '',
            secondFloorRateOfConstruction: '',
            secondFloorValueOfConstruction: '',
            thirdFloorSqft: '',
            thirdFloorRateOfConstruction: '',
            thirdFloorValueOfConstruction: '',
            fourthFloorSqft: '',
            fourthFloorRateOfConstruction: '',
            fourthFloorValueOfConstruction: '',
            fifthFloorSqft: '',
            fifthFloorRateOfConstruction: '',
            fifthFloorValueOfConstruction: '',
            sixthFloorSqft: '',
            sixthFloorRateOfConstruction: '',
            sixthFloorValueOfConstruction: '',
            basementFloorSqft: '',
            basementFloorRateOfConstruction: '',
            basementFloorValueOfConstruction: '',
            carpetAreaInSqft: '',
            carpetAreaRateOfConstruction: '',
            carpetAreaValueOfConstruction: '',

            // EXTRA ITEMS TABLE
            extraItemsLand: '',
            extraItemsLandAmount: '',
            extraItemsBuilding: '',
            extraItemsBuildingAmount: '',
            extraItemsExtra: '',
            extraItemsExtraAmount: '',
            extraItemsAmenities: '',
            extraItemsAmenitiesAmount: '',
            extraItemsMiscellaneous: '',
            extraItemsMiscellaneousAmount: '',
            extraItemsServices: '',
            extraItemsServicesAmount: '',
            extraItemsTotalValue: '',

            // ELECTRICAL & PLUMBING INSTALLATIONS
            electricalInstallation: '',
            typeOfWiring: '',
            classOfFittings: '',
            numberOfLightPoints: '',
            farPlugs: '',
            sparePlug: '',
            anyOtherElectricalItem: '',
            plumbingInstallation: '',
            numberOfWaterClassAndTaps: '',
            noWashBasins: '',
            noUrinals: '',
            noOfBathtubs: '',
            waterMeterTapsEtc: '',
            anyOtherPlumbingFixture: '',

            // FIVE FEET AROUND PLOT
            feetAroundPlot: '',
            rcMasonryWallsUpToPlinth: '',
            aboveRcMasonryWallsExternally: '',

            // BUILDING VALUATION EXTRA DETAILS
            estimatedRCCRepairCostOfConstruction: '',
            floorAreaSqft: '',
            rateOfConstructionPerSqft: '',
            valueOfConstruction: '',
            rateOfConstructionValues: '',

            // SERVICES (Part F)
            services1Description: '',
            services1Amount: '',
            waterSupplyArrangements: '',
            waterSupplyArrangementsAmount: '',
            undergroundStorageCapacity: '',
            undergroundStorageCapacityAmount: '',
            drainageArrangements: '',
            drainageArrangementsAmount: '',
            compoundWall: '',
            compoundWallAmount: '',
            siteDevelopment: '',
            siteDevelopmentAmount: '',
            swimmingPool: '',
            swimmingPoolAmount: '',
            servicesTotal: '',

            // PROPERTY VALUATION NARRATIVE
            abstractOfEntireProperty: '',
            partALandAmount: '',
            partBBuildingAmount: '',
            partCExtraItemsAmount: '',
            partDExtraItemsAmount: '',
            partEExtraItemsAmount: '',
            partFServicesAmount: '',
            totalAbstractValue: '',

            // FAIR MARKET VALUE OPINION
            fairMarketValueOpinion: '',
            fairMarketValueAmount: '',
            propertyAnalysisStatement: '',
            openMarketValueStatement: '',

            // BUILDING VALUATION COMPOUND WALL
            buildingValuationCompoundWall: '',
            buildingValuationHeight: '',
            buildingValuationLength: '',
            buildingValuationTypeOfConstruction: '',
            buildingValuationElectricalInstallation: '',
            buildingValuationTypeOfWiring: '',
            buildingValuationClassOfFittings: '',
            buildingValuationNumberOfLightPoints: '',
            buildingValuationFarPlugs: '',
            buildingValuationSparePlug: '',
            buildingValuationAnyOtherElectricalItem: '',
            buildingValuationPlumbingInstallation: '',
            buildingValuationNumberOfWaterClassAndTaps: '',
            buildingValuationNoWashBasins: '',
            buildingValuationNoUrinals: '',
            buildingValuationNoOfBathtubs: '',
            buildingValuationWaterMeterTapsEtc: '',
            buildingValuationAnyOtherPlumbingFixture: '',

            // PART C - EXTRA ITEMS WITH FLOOR WISE DETAILS
            partCExtraItemsFloorWise: '',
            partCExtraItemsGroundFloor: '',
            partCExtraItemsServiceFloor: '',
            partCExtraItemsFirstFloor: '',
            partCExtraItemsSecondFloor: '',
            partCExtraItemsThirdFloor: '',
            partCExtraItemsFourthFloor: '',
            partCExtraItemsFifthFloor: '',
            partCExtraItemsSixthFloor: '',
            partCExtraItemsBasementFloor: '',
            partCExtraItemsCarotyArea: '',

            // PART C - EXTRA ITEMS WITH SQFT AND RATES
            partCExtraItemsSqftGroundFloor: '',
            partCExtraItemsSqftServiceFloor: '',
            partCExtraItemsSqftFirstFloor: '',
            partCExtraItemsSqftSecondFloor: '',
            partCExtraItemsSqftThirdFloor: '',
            partCExtraItemsSqftFourthFloor: '',
            partCExtraItemsSqftFifthFloor: '',
            partCExtraItemsSqftSixthFloor: '',
            partCExtraItemsSqftBasementFloor: '',
            partCExtraItemsSqftCarpetArea: '',

            partCExtraItemsRateGroundFloor: '',
            partCExtraItemsRateServiceFloor: '',
            partCExtraItemsRateFirstFloor: '',
            partCExtraItemsRateSecondFloor: '',
            partCExtraItemsRateThirdFloor: '',
            partCExtraItemsRateFourthFloor: '',
            partCExtraItemsRateFifthFloor: '',
            partCExtraItemsRateSixthFloor: '',
            partCExtraItemsRateBasementFloor: '',
            partCExtraItemsRateCarpetArea: '',

            partCExtraItemsValueGroundFloor: '',
            partCExtraItemsValueServiceFloor: '',
            partCExtraItemsValueFirstFloor: '',
            partCExtraItemsValueSecondFloor: '',
            partCExtraItemsValueThirdFloor: '',
            partCExtraItemsValueFourthFloor: '',
            partCExtraItemsValueFifthFloor: '',
            partCExtraItemsValueSixthFloor: '',
            partCExtraItemsValueBasementFloor: '',
            partCExtraItemsValueCarpetArea: '',

            // AGE OF BUILDING DEPRECIATION
            ageOfBuildingYears: '',
            lifeOfBuilding: '',
            depreciationPercentage: '',

            // LAND VALUATION SECTION
            floorAreaSqftLand: '',
            ratePerSqftLand: '',
            interior0PercentLand: '',
            entranceCanopyArea: '',

            // PART A - LAND
            partALand1Description: '',
            partALand1Amount: '',
            partALand2Description: '',
            partALand2Amount: '',
            partALand3Description: '',
            partALand3Amount: '',
            partALand4Description: '',
            partALand4Amount: '',
            partALandTotal: '',

            // PART B - BUILDING
            partBBuilding1Description: '',
            partBBuilding1Amount: '',
            partBBuilding2Description: '',
            partBBuilding2Amount: '',
            partBBuilding3Description: '',
            partBBuilding3Amount: '',
            partBBuilding4Description: '',
            partBBuilding4Amount: '',
            partBBuildingTotal: '',

            // PART F - SERVICES DETAILS
            partFServices1Description: '',
            partFServices1Amount: '',
            partFServices2Description: '',
            partFServices2Amount: '',
            partFServices3Description: '',
            partFServices3Amount: '',
            partFServices4Description: '',
            partFServices4Amount: '',
            partFServices5Description: '',
            partFServices5Amount: '',

            // ORNAMENTAL EXTENDED
            ornamental1Description: '',
            ornamental1Amount: '',
            ornamental2Description: '',
            ornamental2Amount: '',
            ornamental3Description: '',
            ornamental3Amount: '',
            ornamental4Description: '',
            ornamental4Amount: '',
            ornamental5Description: '',
            ornamental5Amount: '',

            // ADDITIONAL BUILDING DETAILS
            ageOfBuildingDescription: '',
            lifeOfBuildingYears: '',
            depreciationValue: '',
            depreciatedRate: '',

            // LAND DETAILS EXTENDED
            floorAreaDescription: '',
            floorAreaSqftValue: '',
            floorAreaToSqftFirstFloor: '',
            floorAreaBuiltUpCompletion: '',
            floorAreaCarpetArea: '',
            floorAreaEntranceCanopyArea: '',

            // RATES & VALUES EXTENDED
            rateOfConstructionPercentage: '',
            depreciationPercentageValue: '',
            yetOfProperty: '',

            // INTERIOR & FINISH DETAILS
            interiorExcellent: '',
            interiorGood: '',
            interiorPoor: '',

            // COMPOUND WALL & FIXTURES
            compoundWallMasonryHeight: '',
            compoundWallFenceDetails: '',

            // WATER & SANITATION
            waterTankAboveGround: '',
            waterTankUnderground: '',
            waterTankRCCStorageCapacity: '',

            // SITE DEVELOPMENT
            siteDevelopmentDrainageDetails: '',
            siteDevelopmentCompoundWallHeight: '',
            siteDevelopmentTrees: '',

            // FIRST FLOOR AREA SECTIONS
            firstFloorNorthSection: '',
            firstFloorSouthSection: '',
            firstFloorEastSection: '',
            firstFloorWestSection: '',

            // ADDITIONAL DEPRECIATION & AGE FIELDS
            ageOfBuildingMonths: '',
            totalLifeOfBuilding: '',
            remainingLifePercentage: '',

            // ADDITIONAL MISSING FIELDS
            portico: '',
            porticoAmount: '',
            description: '',
            land: '',
            building: '',
            extraItems: '',
            amenities: '',
            miscellaneous: '',
            services: '',
            partACarpetArea: '',
            partBCarpetArea: '',
            partCCarpetArea: '',
            partDCarpetArea: '',
            partECarpetArea: '',
            partFCarpetArea: '',

            // ADDITIONAL BUILDING DETAILS
            serviceFloor: '',
            serviceFloorSqft: '',
            serviceFloorRateOfConstruction: '',
            serviceFloorValueOfConstruction: '',

            // PARKING & GARAGE
            parkingFloorSqft: '',
            parkingFloorRateOfConstruction: '',
            parkingFloorValueOfConstruction: '',

            // STILT FLOOR
            stiltFloor: '',
            stiltFloorSqft: '',
            stiltFloorRateOfConstruction: '',
            stiltFloorValueOfConstruction: '',

            // EXTRA COVERED AREA
            extraCoveredArea: '',
            extraCoveredAreaSqft: '',
            extraCoveredAreaRateOfConstruction: '',
            extraCoveredAreaValueOfConstruction: ''
        },

        // CUSTOM FIELDS FOR DROPDOWN HANDLING
        customBankName: '',
        customCity: '',
    });

    const [imagePreviews, setImagePreviews] = useState([]);
    const [locationImagePreviews, setLocationImagePreviews] = useState([]);
    
    const defaultBanks = ["SBI", "HDFC", "ICICI", "Axis", "PNB", "BOB"];
    const defaultCities = ["Surat", "vadodara", "Ahmedabad", "Kheda"];
    const defaultDsaNames = ["Bhayva Shah", "Shailesh Shah", "Vijay Shah"];
    const defaultEngineers = ["Bhavesh", "Bhanu", "Ronak", "Mukesh"];

    const [banks, setBanks] = useState(defaultBanks);
    const [cities, setCities] = useState(defaultCities);
    const [dsaNames, setDsaNames] = useState(defaultDsaNames);
    const [engineerNames, setEngineerNames] = useState(defaultEngineers);
    const [customOptions, setCustomOptions] = useState({
        dsa: [],
        engineerName: [],
        bankName: [],
        city: []
    });

    const fileInputRef1 = useRef(null);
    const fileInputRef2 = useRef(null);
    const fileInputRef3 = useRef(null);
    const fileInputRef4 = useRef(null);
    const documentFileInputRef = useRef(null);
    const locationFileInputRef = useRef(null);

    const username = user?.username || "";
    const role = user?.role || "";
    const clientId = user?.clientId || "";

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

    const handleDownloadPDF = async () => {
        try {
            dispatch(showLoader());
            // ALWAYS fetch fresh data from DB - do not use local state which may be stale
            let dataToDownload;

            try {
                dataToDownload = await getUbiApfFormById(id, username, role, clientId);
                console.log('✅ Fresh UBI APF data fetched for PDF:', {
                    bankName: dataToDownload?.bankName,
                    city: dataToDownload?.city
                });
            } catch (fetchError) {
                console.error('❌ Failed to fetch fresh UBI APF data:', fetchError);
                // Only fallback to valuation/formData if fetch fails
                dataToDownload = valuation;
                if (!dataToDownload) {
                    console.warn('UBI APF form data is null, using formData');
                    dataToDownload = formData;
                }
            }

            await generateRecordPDFOffline(dataToDownload);
            showSuccess('PDF downloaded successfully');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            showError('Failed to download PDF');
        } finally {
            dispatch(hideLoader());
        }
    };

    useEffect(() => {
        if (id) loadValuation();
    }, [id]);

    // Helper function to convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Fetch dropdown data from API (non-blocking with defaults already set)
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [banksData, citiesData, dsaData, engineerData] = await Promise.all([
                    getCustomOptions('banks'),
                    getCustomOptions('cities'),
                    getCustomOptions('dsa'),
                    getCustomOptions('engineers')
                ]);
                
                // Only update if API returns non-empty data
                if (Array.isArray(banksData) && banksData.length > 0) {
                    setBanks(banksData);
                }
                if (Array.isArray(citiesData) && citiesData.length > 0) {
                    setCities(citiesData);
                }
                if (Array.isArray(dsaData) && dsaData.length > 0) {
                    setDsaNames(dsaData);
                }
                if (Array.isArray(engineerData) && engineerData.length > 0) {
                    setEngineerNames(engineerData);
                }
            } catch (error) {
                console.warn('Could not fetch dropdown options from API, using defaults:', error.message);
                // Defaults are already set, no action needed
            }
        };
        
        // Try to fetch API data, but don't block the UI
        fetchDropdownData();
    }, []);

    // Ensure bankName and city states are valid when arrays are loaded
    useEffect(() => {
        if (banks.length > 0 && !banks.includes(bankName) && bankName !== "other") {
            setBankName("other");
        }
        if (cities.length > 0 && !cities.includes(city) && city !== "other") {
            setCity("other");
        }
    }, [banks, cities, bankName, city]);

    const loadValuation = async () => {
        const savedData = localStorage.getItem(`valuation_draft_${username}`);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.uniqueId === id) {
                setValuation(parsedData);
                mapDataToForm(parsedData);
                return;
            }
        }

        try {
            // Pass user info for authentication
            const dbData = await getUbiApfFormById(id, username, role, clientId);
            setValuation(dbData);
            mapDataToForm(dbData);

            // Restore property image previews from database
            if (dbData.propertyImages && Array.isArray(dbData.propertyImages)) {
                const propertyPreviews = dbData.propertyImages
                    .filter(img => img && typeof img === 'object')
                    .map((img, idx) => {
                        let previewUrl = '';
                        if (img.url) {
                            previewUrl = img.url;
                        } else if (img.path) {
                            const fileName = img.path.split('\\').pop() || img.path.split('/').pop();
                            previewUrl = `/api/uploads/${fileName}`;
                        } else if (img.fileName) {
                            previewUrl = `/api/uploads/${img.fileName}`;
                        }
                        return {
                            preview: previewUrl,
                            file: null,
                            inputNumber: img.inputNumber || 1
                        };
                    })
                    .filter(preview => preview.preview);
                if (propertyPreviews.length > 0) {
                    setImagePreviews(propertyPreviews);
                }
            }

            // Restore location image previews from database
            if (dbData.locationImages && Array.isArray(dbData.locationImages)) {
                const locationPreviews = dbData.locationImages
                    .filter(img => img && typeof img === 'object')
                    .map((img, idx) => {
                        let previewUrl = '';
                        if (img.url) {
                            previewUrl = img.url;
                        } else if (img.path) {
                            const fileName = img.path.split('\\').pop() || img.path.split('/').pop();
                            previewUrl = `/api/uploads/${fileName}`;
                        } else if (img.fileName) {
                            previewUrl = `/api/uploads/${img.fileName}`;
                        }
                        return {
                            preview: previewUrl,
                            file: null
                        };
                    })
                    .filter(preview => preview.preview);
                if (locationPreviews.length > 0) {
                    setLocationImagePreviews(locationPreviews);
                }
            }

            // Restore document previews from database
            if (dbData.documentPreviews && Array.isArray(dbData.documentPreviews)) {
                setFormData(prev => ({
                    ...prev,
                    documentPreviews: dbData.documentPreviews
                }));
            }

            setBankName(dbData.bankName || "");
            setCity(dbData.city || "");
            setDsa(dbData.dsa || "");
        } catch (error) {
            console.error("Error loading valuation:", error);
            // Continue without data
        }
    };

    const mapDataToForm = (data) => {
        // Use the defaults if arrays are empty
        const actualBanks = banks.length > 0 ? banks : defaultBanks;
        const actualCities = cities.length > 0 ? cities : defaultCities;
        const actualDsaNames = dsaNames.length > 0 ? dsaNames : defaultDsaNames;
        const actualEngineers = engineerNames.length > 0 ? engineerNames : defaultEngineers;

        const bankValue = actualBanks.includes(data.bankName) ? data.bankName : "other";
        const cityValue = actualCities.includes(data.city) ? data.city : "other";
        const dsaValue = actualDsaNames.includes(data.dsa) ? data.dsa : "other";
        const engineerValue = actualEngineers.includes(data.engineerName) ? data.engineerName : "other";

        setBankName(bankValue);
        setCity(cityValue);
        setDsa(dsaValue);

        setFormData(prev => {
            // Create a new pdfDetails object by merging prev defaults with incoming data
            const mergedPdfDetails = {
                ...prev.pdfDetails,
                ...(data.pdfDetails || {})
            };

            return {
                ...prev,
                ...data,
                pdfDetails: mergedPdfDetails
            };
        });
    };

    const canEdit = isLoggedIn && (
        (role === "admin") ||
        (role === "manager" && (valuation?.status === "pending" || valuation?.status === "rejected" || valuation?.status === "on-progress" || valuation?.status === "rework")) ||
        ((role === "user") && (valuation?.status === "rejected" || valuation?.status === "pending" || valuation?.status === "rework"))
    );

    const canEditField = (fieldName) => {
        // Allow editing if status allows it
        return canEdit;
    };

    const canApprove = isLoggedIn && (role === "manager" || role === "admin") &&
        (valuation?.status === "pending" || valuation?.status === "on-progress" || valuation?.status === "rejected" || valuation?.status === "rework");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleIntegerInputChange = (e, callback) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (callback) callback(value);
    };

    const handleLettersOnlyInputChange = (e, callback) => {
        const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
        if (callback) callback(value);
    };

    const handleSave = async () => {
        try {
            dispatch(showLoader("Saving form..."));

            // Prepare complete payload with all data
            const payload = {
                ...formData,
                // Ensure pdfDetails is included with all fields
                pdfDetails: {
                    ...formData.pdfDetails,
                    // Auto-include calculation fields for valuation results
                    lastUpdatedBy: user.username,
                    lastUpdatedByRole: user.role
                },
                // Metadata
                lastUpdatedAt: new Date().toISOString(),
                status: formData.status || 'pending'
            };

            console.log("[handleSave] Saving UBI APF form with payload:", {
                id,
                username: user.username,
                pdfDetailsFieldsCount: Object.keys(payload.pdfDetails || {}).length
            });

            await updateUbiApfForm(id, payload, user.username, user.role, user.clientId);
            invalidateCache();
            dispatch(hideLoader());
            showSuccess('UBI APF form saved successfully');
        } catch (error) {
            console.error("Error saving UBI APF form:", error);
            dispatch(hideLoader());
            showError(error.message || 'Failed to save UBI APF form');
        }
    };

    const handleValuationChange = (field, value) => {
        setFormData(prev => {
            const newPdfDetails = {
                ...prev.pdfDetails,
                [field]: value
            };

            // Auto-calculate Estimated Value = Qty × Rate for all 10 items
            const items = [
                { qtyField: 'presentValueQty', rateField: 'presentValueRate', valueField: 'presentValue' },
                { qtyField: 'wardrobesQty', rateField: 'wardrobesRate', valueField: 'wardrobes' },
                { qtyField: 'showcasesQty', rateField: 'showcasesRate', valueField: 'showcases' },
                { qtyField: 'kitchenArrangementsQty', rateField: 'kitchenArrangementsRate', valueField: 'kitchenArrangements' },
                { qtyField: 'superfineFinishQty', rateField: 'superfineFinishRate', valueField: 'superfineFinish' },
                { qtyField: 'interiorDecorationsQty', rateField: 'interiorDecorationsRate', valueField: 'interiorDecorations' },
                { qtyField: 'electricityDepositsQty', rateField: 'electricityDepositsRate', valueField: 'electricityDeposits' },
                { qtyField: 'collapsibleGatesQty', rateField: 'collapsibleGatesRate', valueField: 'collapsibleGates' },
                { qtyField: 'potentialValueQty', rateField: 'potentialValueRate', valueField: 'potentialValue' },
                { qtyField: 'otherItemsQty', rateField: 'otherItemsRate', valueField: 'otherItems' }
            ];

            // Check if the changed field is a qty or rate field and auto-calculate
            items.forEach(item => {
                if (field === item.qtyField || field === item.rateField) {
                    const qty = parseFloat(newPdfDetails[item.qtyField]) || 0;
                    const rate = parseFloat(newPdfDetails[item.rateField]) || 0;
                    const estimatedValue = qty * rate;
                    newPdfDetails[item.valueField] = estimatedValue > 0 ? estimatedValue.toString() : '';
                }
            });

            // Auto-populate Value of Flat section based on ROUND FIGURE value
            const isQtyOrRateField = items.some(item => field === item.qtyField || field === item.rateField);
            if (isQtyOrRateField) {
                const totalValuation = items.reduce((sum, item) => {
                    const value = parseFloat(newPdfDetails[item.valueField]) || 0;
                    return sum + value;
                }, 0);

                // Round to nearest 1000
                const roundFigureTotal = Math.round(totalValuation / 1000) * 1000;

                // Auto-populate the 4 calculated fields based on ROUND FIGURE (if not manually edited)
                if (!newPdfDetails.fairMarketValue || newPdfDetails.fairMarketValue === '') {
                    newPdfDetails.fairMarketValue = roundFigureTotal > 0 ? roundFigureTotal.toString() : '';
                }
                if (!newPdfDetails.realizableValue || newPdfDetails.realizableValue === '') {
                    newPdfDetails.realizableValue = roundFigureTotal > 0 ? (roundFigureTotal * 0.9).toString() : '';
                }
                if (!newPdfDetails.distressValue || newPdfDetails.distressValue === '') {
                    newPdfDetails.distressValue = roundFigureTotal > 0 ? (roundFigureTotal * 0.8).toString() : '';
                }
                if (!newPdfDetails.insurableValue || newPdfDetails.insurableValue === '') {
                    newPdfDetails.insurableValue = roundFigureTotal > 0 ? (roundFigureTotal * 0.35).toString() : '';
                }
            }

            return {
                ...prev,
                pdfDetails: newPdfDetails
            };
        });
    };

    const handleLocationImageUpload = async (e) => {
        const files = e.target.files;
        if (!files) return;

        for (let file of files) {
            try {
                const base64 = await fileToBase64(file);
                setLocationImagePreviews(prev => [
                    ...prev,
                    { preview: base64, name: file.name, file: file }
                ]);
            } catch (error) {
                console.error('Error converting file to base64:', error);
                showError('Failed to upload image');
            }
        }
    };

    const handleImageUpload = async (e) => {
        const files = e.target.files;
        if (!files) return;

        for (let file of files) {
            try {
                const base64 = await fileToBase64(file);
                setImagePreviews(prev => [
                    ...prev,
                    { preview: base64, name: file.name, file: file }
                ]);
            } catch (error) {
                console.error('Error converting file to base64:', error);
                showError('Failed to upload image');
            }
        }
    };

    const removeLocationImage = (index) => {
        setLocationImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleDocumentUpload = async (e) => {
        const files = e.target.files;
        if (!files) return;

        // Add local previews immediately
        const filesToAdd = Array.from(files).map((file) => {
            const preview = URL.createObjectURL(file);
            return { file, preview, fileName: file.name, size: file.size, isImage: true };
        });

        // Display local previews
        const localPreviews = filesToAdd.map(f => ({
            preview: f.preview,
            file: f.file,
            fileName: f.fileName,
            size: f.size
        }));

        setFormData(prev => ({
            ...prev,
            documentPreviews: [
                ...(prev.documentPreviews || []),
                ...localPreviews
            ]
        }));

        try {
            // Upload images using same service as Property Images with compression
            const uploadPromises = filesToAdd.map(f => ({ file: f.file, inputNumber: 1 }));
            const uploadedImages = await uploadPropertyImages(uploadPromises, valuation.uniqueId);

            // Update with actual uploaded URLs (replace local previews)
            setFormData(prev => {
                const newPreviews = [...(prev.documentPreviews || [])];
                let uploadIndex = 0;
                
                // Update the last N items (where N = uploadedImages.length) with actual URLs
                for (let i = newPreviews.length - uploadPromises.length; i < newPreviews.length && uploadIndex < uploadedImages.length; i++) {
                    if (uploadedImages[uploadIndex]) {
                        newPreviews[i] = {
                            fileName: newPreviews[i].fileName,
                            size: newPreviews[i].size,
                            url: uploadedImages[uploadIndex].url,
                            publicId: uploadedImages[uploadIndex].publicId
                        };
                        uploadIndex++;
                    }
                }

                return {
                    ...prev,
                    documentPreviews: newPreviews
                };
            });
        } catch (error) {
            console.error('Error uploading supporting images:', error);
            showError('Failed to upload images: ' + error.message);
            
            // Remove the local previews on error
            setFormData(prev => ({
                ...prev,
                documentPreviews: (prev.documentPreviews || []).slice(0, -filesToAdd.length)
            }));
        }
        
        // Reset input
        if (documentFileInputRef.current) {
            documentFileInputRef.current.value = '';
        }
    };

    const removeDocument = (index) => {
        setFormData(prev => ({
            ...prev,
            documentPreviews: (prev.documentPreviews || []).filter((_, i) => i !== index)
        }));
    };

    const handleCoordinateChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            coordinates: {
                ...prev.coordinates,
                [field]: value
            }
        }));
    };

    const handleDirectionChange = (direction, value) => {
        setFormData(prev => ({
            ...prev,
            directions: {
                ...prev.directions,
                [direction]: value
            }
        }));
    };

    const validateForm = () => {
        const errors = [];

        // === CLIENT INFORMATION ===
        if (!formData.clientName || !formData.clientName.trim()) {
            errors.push("Client Name is required");
        }

        if (!formData.mobileNumber || !formData.mobileNumber.trim()) {
            errors.push("Mobile Number is required");
        } else {
            // Mobile number validation - exactly 10 digits
            const mobileDigits = formData.mobileNumber.replace(/\D/g, '');
            if (mobileDigits.length !== 10) {
                errors.push("Mobile Number must be 10 digits");
            }
        }

        if (!formData.address || !formData.address.trim()) {
            errors.push("Address is required");
        }

        // === BANK & CITY ===
        const finalBankName = bankName === "other" ? formData.customBankName : bankName;
        if (!finalBankName || !finalBankName.trim()) {
            errors.push("Bank Name is required");
        }

        const finalCity = city === "other" ? formData.customCity : city;
        if (!finalCity || !finalCity.trim()) {
            errors.push("City is required");
        }

        // === MARKET APPLICATIONS / DSA (Sales Agent) ===
        const finalDsa = formData.dsa === "other" ? formData.customDsa : formData.dsa;
        if (!finalDsa || !finalDsa.trim()) {
            errors.push("Market Applications / DSA (Sales Agent) is required");
        }

        // === ENGINEER NAME ===
        const finalEngineerName = formData.engineerName === "other" ? formData.customEngineerName : formData.engineerName;
        if (!finalEngineerName || !finalEngineerName.trim()) {
            errors.push("Engineer Name is required");
        }

        // === PAYMENT INFORMATION ===
        if (formData.payment === "yes" && (!formData.collectedBy || !formData.collectedBy.trim())) {
            errors.push("Collected By name is required when payment is collected");
        }

        // === GPS COORDINATES VALIDATION ===
        if (formData.coordinates.latitude || formData.coordinates.longitude) {
            if (formData.coordinates.latitude) {
                const lat = parseFloat(formData.coordinates.latitude);
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    errors.push("Latitude must be a valid number between -90 and 90");
                }
            }

            if (formData.coordinates.longitude) {
                const lng = parseFloat(formData.coordinates.longitude);
                if (isNaN(lng) || lng < -180 || lng > 180) {
                    errors.push("Longitude must be a valid number between -180 and 180");
                }
            }
        }

        // === PROPERTY IMAGES VALIDATION ===
        if (imagePreviews.length === 0) {
            errors.push("Property image is required");
        }

        // === LOCATION IMAGES VALIDATION ===
        if (locationImagePreviews.length === 0) {
            errors.push("Location image is required");
        }

        return errors;
    };

    const validatePdfDetails = () => {
        const errors = [];
        return errors;
    };

    const handleManagerAction = (action) => {
        setModalAction(action);
        setModalFeedback("");
        setModalOpen(true);
    };

    const handleModalOk = async () => {
        const statusValue = modalAction === "approve" ? "approved" : "rejected";
        const actionLabel = modalAction === "approve" ? "Approve" : "Reject";

        try {
            setLoading(true);
            dispatch(showLoader(`${actionLabel}ing form...`));

            const responseData = await managerSubmitUbiApfForm(id, statusValue, modalFeedback, user.username, user.role);

            invalidateCache("/bof-maharashtra");

            // Update the form state with response data from backend
            setValuation(responseData);

            showSuccess(`BOF Maharashtra form ${statusValue} successfully!`);
            dispatch(hideLoader());
            setModalOpen(false);

            setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 300);
        } catch (err) {
            showError(err.message || `Failed to ${actionLabel.toLowerCase()} form`);
            dispatch(hideLoader());
            setLoading(false);
        }
    };

    const onFinish = async (e) => {
        e.preventDefault();

        const isUserUpdate = role === "user" && (valuation.status === "pending" || valuation.status === "rejected" || valuation.status === "rework");
        const isManagerUpdate = role === "manager" && (valuation.status === "pending" || valuation.status === "rejected" || valuation.status === "on-progress" || valuation.status === "rework");
        const isAdminUpdate = role === "admin";

        if (!isUserUpdate && !isManagerUpdate && !isAdminUpdate) {
            showError("You don't have permission to update this form");
            return;
        }

        // Validate form
        const validationErrors = validateForm();
        const pdfDetailsErrors = validatePdfDetails();
        const allErrors = [...validationErrors, ...pdfDetailsErrors];
        if (allErrors.length > 0) {
            // Show single consolidated error instead of multiple notifications
            showError(` ${allErrors.join(", ")}`);
            return;
        }

        try {
            setLoading(true);
            dispatch(showLoader("Saving..."));

            const payload = {
                clientId: clientId,
                uniqueId: formData.uniqueId || id,
                username: formData.username || username,
                dateTime: formData.dateTime,
                day: formData.day,
                bankName: bankName === "other" ? (formData.customBankName || "").trim() : bankName,
                city: city === "other" ? (formData.customCity || "").trim() : city,
                clientName: formData.clientName,
                mobileNumber: formData.mobileNumber,
                address: formData.address,
                payment: formData.payment,
                collectedBy: formData.collectedBy,
                dsa: dsa === "other" ? (formData.customDsa || "").trim() : dsa,
                engineerName: formData.engineerName === "other" ? (formData.customEngineerName || "").trim() : formData.engineerName,
                notes: formData.notes,
                elevation: formData.elevation,
                directions: formData.directions,
                coordinates: formData.coordinates,
                documentPreviews: (formData.documentPreviews || []).map(doc => ({
                    fileName: doc.fileName,
                    size: doc.size,
                    ...(doc.url && { url: doc.url })
                })),
                status: "on-progress",
                pdfDetails: formData.pdfDetails
            };

            // Handle image uploads - parallel (including supporting images)
            const [uploadedPropertyImages, uploadedLocationImages, uploadedSupportingImages] = await Promise.all([
                (async () => {
                    const newPropertyImages = imagePreviews.filter(p => p && p.file);
                    if (newPropertyImages.length > 0) {
                        return await uploadPropertyImages(newPropertyImages, valuation.uniqueId);
                    }
                    return [];
                })(),
                (async () => {
                    const newLocationImages = locationImagePreviews.filter(p => p && p.file);
                    if (newLocationImages.length > 0) {
                        return await uploadLocationImages(newLocationImages, valuation.uniqueId);
                    }
                    return [];
                })(),
                (async () => {
                    // Handle supporting images (documents) - upload any with file objects
                    const newSupportingImages = (formData.documentPreviews || []).filter(d => d && d.file);
                    if (newSupportingImages.length > 0) {
                        return await uploadPropertyImages(newSupportingImages, valuation.uniqueId);
                    }
                    return [];
                })()
            ]);

            // Combine previously saved images with newly uploaded URLs
            const previousPropertyImages = imagePreviews
                .filter(p => p && !p.file && p.preview)
                .map((preview, idx) => ({
                    url: preview.preview,
                    index: idx
                }));

            // For location images: if new image uploaded, use only the new one; otherwise use previous
            const previousLocationImages = (uploadedLocationImages.length === 0)
                ? locationImagePreviews
                    .filter(p => p && !p.file && p.preview)
                    .map((preview, idx) => ({
                        url: preview.preview,
                        index: idx
                    }))
                : [];

            // Combine supporting images with previously saved ones
            const previousSupportingImages = (formData.documentPreviews || [])
                .filter(d => d && !d.file && d.url)
                .map(d => ({
                    fileName: d.fileName,
                    size: d.size,
                    url: d.url
                }));

            payload.propertyImages = [...previousPropertyImages, ...uploadedPropertyImages];
            payload.locationImages = uploadedLocationImages.length > 0 ? uploadedLocationImages : previousLocationImages;
            payload.documentPreviews = [...previousSupportingImages, ...uploadedSupportingImages.map(img => ({
                fileName: img.originalFileName || img.publicId || 'Image',
                size: img.bytes || img.size || 0,
                url: img.url
            }))];

            // Clear draft before API call
            localStorage.removeItem(`valuation_draft_${username}`);

            // Call API to update BOF Maharashtra form
            const apiResponse = await updateUbiApfForm(id, payload, username, role, clientId);
            invalidateCache("/bof-maharashtra");

            // Get the actual status from API response (server updates to on-progress on save)
            const newStatus = apiResponse?.status || "on-progress";

            // Update local state with API response
            const updatedValuation = {
                ...valuation,
                ...(apiResponse || {}),
                ...payload,
                status: newStatus, // Use server-confirmed status
                lastUpdatedBy: apiResponse?.lastUpdatedBy || username,
                lastUpdatedByRole: apiResponse?.lastUpdatedByRole || role,
                lastUpdatedAt: apiResponse?.lastUpdatedAt || new Date().toISOString()
            };

            setValuation(updatedValuation);
            // Set bank and city states based on whether they're in default lists
            const bankState = banks.includes(payload.bankName) ? payload.bankName : "other";
            const cityState = cities.includes(payload.city) ? payload.city : "other";
            setBankName(bankState);
            setCity(cityState);
            // Update formData with trimmed custom values
            setFormData(prev => ({
                ...prev,
                ...payload,
                customBankName: bankState === "other" ? payload.bankName : "",
                customCity: cityState === "other" ? payload.city : "",
                customDsa: formData.dsa === "other" ? (payload.dsa || "").trim() : "",
                customEngineerName: formData.engineerName === "other" ? (payload.engineerName || "").trim() : ""
            }));

            showSuccess("Form saved successfully!");
            dispatch(hideLoader());
            setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 300);
        } catch (err) {
            const errorMessage = err.message || "Failed to update form";
            showError(errorMessage);
            dispatch(hideLoader());
            setLoading(false);
        }
    };

    const renderGeneralTab = () => (
        <div className="space-y-6">
            <div className="mb-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-gray-900 mb-4">Purpose of Valuation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Purpose of Valuation</Label>
                        <Input
                            placeholder="e.g., Mortgage/Loan Purpose"
                            value={formData.pdfDetails?.purposeOfValuation || ""}
                            onChange={(e) => handleValuationChange('purposeOfValuation', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Date of Inspection</Label>
                        <Input
                            type="date"
                            value={formData.pdfDetails?.dateOfInspection || ""}
                            onChange={(e) => handleValuationChange('dateOfInspection', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Date of Valuation Made</Label>
                        <Input
                            type="date"
                            value={formData.pdfDetails?.dateOfValuationMade || ""}
                            onChange={(e) => handleValuationChange('dateOfValuationMade', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Place</Label>
                        <Input
                            type="text"
                            placeholder="e.g., City/Location"
                            value={formData.pdfDetails?.place || ""}
                            onChange={(e) => handleValuationChange('place', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <Label className="text-sm font-bold text-gray-900">List of Documents Produced</Label>
                    <Textarea
                        placeholder="Enter list of documents"
                        value={formData.pdfDetails?.listOfDocumentsProduced || ""}
                        onChange={(e) => handleValuationChange('listOfDocumentsProduced', e.target.value)}
                        disabled={!canEdit}
                        className="text-sm rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        rows="3"
                    />
                </div>
            </div>

            {/* OWNER & BRIEF DESCRIPTION */}
            <div className="mb-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-gray-900 mb-4">Owner Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Owner Name(s) and their Address</Label>
                        <Textarea
                            placeholder="Enter owner name and address"
                            value={formData.pdfDetails?.ownerNameAddress || ""}
                            onChange={(e) => handleValuationChange('ownerNameAddress', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            rows="2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Brief Description of the Property</Label>
                        <Textarea
                            placeholder="Enter brief description"
                            value={formData.pdfDetails?.briefDescriptionProperty || ""}
                            onChange={(e) => handleValuationChange('briefDescriptionProperty', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            rows="2"
                        />
                    </div>
                </div>
            </div>

            {/* PROPERTY LOCATION & DESCRIPTION */}
            <div className="mb-6 p-6 bg-cyan-50 rounded-2xl border border-cyan-100">
                <h4 className="font-bold text-gray-900 mb-4">Location of the property</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">a) Plot No./ Survey No.</Label>
                        <Input
                            placeholder="e.g., S. No. 26"
                            value={formData.pdfDetails?.plotSurveyNo || ""}
                            onChange={(e) => handleValuationChange('plotSurveyNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">b) Door No.</Label>
                        <Input
                            placeholder="e.g., Hali No. B-4502"
                            value={formData.pdfDetails?.doorNo || ""}
                            onChange={(e) => handleValuationChange('doorNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">c) T.S. No./Village</Label>
                        <Input
                            placeholder="e.g., Yasai"
                            value={formData.pdfDetails?.tpVillage || ""}
                            onChange={(e) => handleValuationChange('tpVillage', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">d) Ward/Taluka</Label>
                        <Input
                            placeholder="e.g., Taluka"
                            value={formData.pdfDetails?.wardTaluka || ""}
                            onChange={(e) => handleValuationChange('wardTaluka', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">e) District</Label>
                        <Input
                            placeholder="e.g., District"
                            value={formData.pdfDetails?.mandalDistrict || ""}
                            onChange={(e) => handleValuationChange('mandalDistrict', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">f) Date of issue and validity of layout plan</Label>
                        <Input
                            type="date"
                            value={formData.pdfDetails?.layoutPlanIssueDate || ""}
                            onChange={(e) => handleValuationChange('layoutPlanIssueDate', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">g) Approved map/plan issuing authority </Label>
                        <Input
                            placeholder="e.g., CIDCO"
                            value={formData.pdfDetails?.approvedMapAuthority || ""}
                            onChange={(e) => handleValuationChange('approvedMapAuthority', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">h) Whether authenticity of approved map/plan is verified</Label>
                        <select
                            value={formData.pdfDetails?.authenticityVerified || ""}
                            onChange={(e) => handleValuationChange('authenticityVerified', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Status</option>
                            <option value="Verified">Yes</option>
                            <option value="Not Verified">Not</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">i) Any other conveniences provided by our approved plan</Label>
                        <Textarea
                            placeholder="e.g., Parking, Amenities, etc."
                            value={formData.pdfDetails?.otherApprovedPlanDetails || ""}
                            onChange={(e) => handleValuationChange('otherApprovedPlanDetails', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300"
                            rows="2"
                        />
                    </div>


                </div>
            </div>

            {/* POSTAL ADDRESS & CLASSIFICATION */}
            <div className="mb-6 p-6 bg-violet-50 rounded-2xl border border-violet-100">
                <h4 className="font-bold text-gray-900 mb-4">Property Classification & Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Postal Address of the property</Label>
                        <Textarea
                            placeholder="Enter full address"
                            value={formData.pdfDetails?.postalAddress || ""}
                            onChange={(e) => handleValuationChange('postalAddress', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300"
                            rows="3"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">City/Town</Label>
                        <Input
                            placeholder="e.g., Mumbai"
                            value={formData.pdfDetails?.cityTown || ""}
                            onChange={(e) => handleValuationChange('cityTown', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
                <div className="mt-4 space-y-3">
                    <Label className="text-sm font-bold text-gray-900">Area Type</Label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.pdfDetails?.residentialArea || false}
                                onChange={(e) => handleValuationChange('residentialArea', e.target.checked)}
                                disabled={!canEdit}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">Residential Area</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.pdfDetails?.commercialArea || false}
                                onChange={(e) => handleValuationChange('commercialArea', e.target.checked)}
                                disabled={!canEdit}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">Commercial Area</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.pdfDetails?.industrialArea || false}
                                onChange={(e) => handleValuationChange('industrialArea', e.target.checked)}
                                disabled={!canEdit}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">Industrial Area</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* BOUNDARIES OF PROPERTY */}
            <div className="mb-6 p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-4">Boundaries of Property</h4>
                <div className="space-y-6">
                    {/* Plot Boundaries Table */}
                    <div>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-indigo-100">
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">a</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">Boundaries of the property - Plot</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">As per Deed</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">As per Actual</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">North</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotNorthDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotNorthDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotNorthActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotNorthActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">South</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotSouthDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotSouthDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotSouthActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotSouthActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">East</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotEastDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotEastDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotEastActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotEastActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">West</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotWestDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotWestDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotWestActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotWestActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Flat/Shop Boundaries Table */}
                    <div>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-indigo-100">
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">b</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">Boundaries of the property - Flat</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">As per Deed</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">As per Actual</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">North</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopNorthDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopNorthDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopNorthActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopNorthActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">South</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopSouthDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopSouthDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopSouthActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopSouthActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">East</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopEastDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopEastDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopEastActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopEastActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">West</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopWestDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopWestDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopWestActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopWestActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* DIMENSIONS OF THE PROPERTY */}
            <div className="mb-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-gray-900 mb-4">Dimensions of the Unit</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Dimensions (as per Document)</Label>
                        <Input
                            placeholder="e.g., 28.88 Sq. ft. / 2.88 Sq. ft."
                            value={formData.pdfDetails?.dimensionsDeed || ""}
                            onChange={(e) => handleValuationChange('dimensionsDeed', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Dimensions (as per Actuals)</Label>
                        <Input
                            placeholder="e.g., 28.88 Sq. ft. / 2.88 Sq. ft."
                            value={formData.pdfDetails?.dimensionsActual || ""}
                            onChange={(e) => handleValuationChange('dimensionsActual', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
            </div>

            {/* EXTENT OF THE UNIT */}
            <div className="mb-6 p-6 bg-green-50 rounded-2xl border border-green-100">
                <h4 className="font-bold text-gray-900 mb-4">Extent of the site</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Extent of Site</Label>
                        <Input
                            placeholder="e.g., ₹ 40,34,950 per Sq. ft."
                            value={formData.pdfDetails?.extentOfUnit || ""}
                            onChange={(e) => handleValuationChange('extentOfUnit', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Latitude/Longitude</Label>
                        <Input
                            placeholder="e.g., 19°07'53.2 N & 73°00"
                            value={formData.pdfDetails?.latitudeLongitude || ""}
                            onChange={(e) => handleValuationChange('latitudeLongitude', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>

                </div>
            </div>

            {/* EXTENT OF SITE & RENT */}
            <div className="mb-6 p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                <h4 className="font-bold text-gray-900 mb-4">Extent & Occupancy Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Extent of Site Considered for Valuation</Label>
                        <Input
                            placeholder="e.g., Area in Sq. ft."
                            value={formData.pdfDetails?.extentOfSiteValuation || ""}
                            onChange={(e) => handleValuationChange('extentOfSiteValuation', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Whether occupied by the owner/tenant? If occupied by tenant, since how long? Rent
                            received per month </Label>
                        <Input
                            placeholder="Owner/ Tenant & Rent Amount"
                            value={formData.pdfDetails?.rentReceivedPerMonth || ""}
                            onChange={(e) => handleValuationChange('rentReceivedPerMonth', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
            </div>

            {/* AREA CLASSIFICATION */}
            <div className="mb-6 p-6 bg-teal-50 rounded-2xl border border-teal-100">
                <h4 className="font-bold text-gray-900 mb-4">Area Classification</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">High/Middle/Poor</Label>
                        <select
                            value={formData.pdfDetails?.areaClassification || ""}
                            onChange={(e) => handleValuationChange('areaClassification', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select</option>
                            <option value="High">High</option>
                            <option value="Middle">Middle</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Metro / Urban / Semi-Urban / Rural</Label>
                        <select
                            value={formData.pdfDetails?.urbanClassification || ""}
                            onChange={(e) => handleValuationChange('urbanClassification', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select</option>
                            <option value="Metro">Metro</option>
                            <option value="Urban">Urban</option>
                            <option value="Semi-Urban">Semi-Urban</option>
                            <option value="Rural">Rural</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Government Type / Comming Under</Label>
                        <select
                            value={formData.pdfDetails?.governmentType || ""}
                            onChange={(e) => handleValuationChange('governmentType', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Type</option>
                            <option value="Municipal">Municipality</option>
                            <option value="Corporation">Corporation</option>
                            <option value="Government">Government</option>
                            <option value="Village Panchayat">Village Panchayat</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Whether covered under any Govt. Enactments</Label>
                        <select
                            value={formData.pdfDetails?.govtEnactmentsCovered || ""}
                            onChange={(e) => handleValuationChange('govtEnactmentsCovered', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderValuationTab = () => {
        const formatIndianCurrency = (value) => {
            if (!value) return '₹0.00';
            const num = parseFloat(value) || 0;
            return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const roundToNearestThousand = (value) => {
            const num = parseFloat(value) || 0;
            return Math.round(num / 1000) * 1000;
        };

        const calculateTotalValuation = () => {
            const values = [
                parseFloat(formData.pdfDetails?.presentValue) || 0,
                parseFloat(formData.pdfDetails?.wardrobes) || 0,
                parseFloat(formData.pdfDetails?.showcases) || 0,
                parseFloat(formData.pdfDetails?.kitchenArrangements) || 0,
                parseFloat(formData.pdfDetails?.superfineFinish) || 0,
                parseFloat(formData.pdfDetails?.interiorDecorations) || 0,
                parseFloat(formData.pdfDetails?.electricityDeposits) || 0,
                parseFloat(formData.pdfDetails?.collapsibleGates) || 0,
                parseFloat(formData.pdfDetails?.potentialValue) || 0,
                parseFloat(formData.pdfDetails?.otherItems) || 0
            ];
            return values.reduce((sum, val) => sum + val, 0);
        };

        const totalValuation = calculateTotalValuation();
        const roundFigureTotal = roundToNearestThousand(totalValuation);

        return (
            <div className="space-y-6">
                {/* PAGE 1 - COST OF CONSTRUCTION */}
                <div className="mb-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                    <h4 className="font-bold text-gray-900 mb-4">Cost of Construction (Page 1)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Sub Area</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.subArea || ""} onChange={(e) => handleValuationChange('subArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Basement Floor</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.basementFloor || ""} onChange={(e) => handleValuationChange('basementFloor', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Ground Area</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.groundArea || ""} onChange={(e) => handleValuationChange('groundArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Socket Floor</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.socketFloor || ""} onChange={(e) => handleValuationChange('socketFloor', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Terrace Area</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.terraceArea || ""} onChange={(e) => handleValuationChange('terraceArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">1st Floor Construction</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.firstFloorConstruction || ""} onChange={(e) => handleValuationChange('firstFloorConstruction', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">2nd Floor Construction</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.secondFloorConstruction || ""} onChange={(e) => handleValuationChange('secondFloorConstruction', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">3rd Floor Construction</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.thirdFloorConstruction || ""} onChange={(e) => handleValuationChange('thirdFloorConstruction', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">4th Floor Construction</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.fourthFloorConstruction || ""} onChange={(e) => handleValuationChange('fourthFloorConstruction', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">5th Floor Construction</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.fifthFloorConstruction || ""} onChange={(e) => handleValuationChange('fifthFloorConstruction', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">6th Floor Construction</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.sixthFloorConstruction || ""} onChange={(e) => handleValuationChange('sixthFloorConstruction', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Glass House Floor</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.glassHouseFloor || ""} onChange={(e) => handleValuationChange('glassHouseFloor', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Total Area Amount</Label>
                            <Input placeholder="e.g., Amount" value={formData.pdfDetails?.totalAreaAmount || ""} onChange={(e) => handleValuationChange('totalAreaAmount', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Value Cost Amount</Label>
                            <Input placeholder="e.g., Amount" value={formData.pdfDetails?.valueCostAmount || ""} onChange={(e) => handleValuationChange('valueCostAmount', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Rate Per Sqft Amount</Label>
                            <Input placeholder="e.g., Rate" value={formData.pdfDetails?.ratePerSqftAmount || ""} onChange={(e) => handleValuationChange('ratePerSqftAmount', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                </div>

                {/* PAGE 2 - ABSTRACT OF PROPERTY */}
                <div className="mb-6 p-6 bg-green-50 rounded-2xl border border-green-100">
                    <h4 className="font-bold text-gray-900 mb-4">Total Abstract of Property (Page 2)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Part A</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.partA || ""} onChange={(e) => handleValuationChange('partA', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Part B</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.partB || ""} onChange={(e) => handleValuationChange('partB', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Part C</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.partC || ""} onChange={(e) => handleValuationChange('partC', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Part D</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.partD || ""} onChange={(e) => handleValuationChange('partD', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Part E</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.partE || ""} onChange={(e) => handleValuationChange('partE', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Part F</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.partF || ""} onChange={(e) => handleValuationChange('partF', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                </div>

                {/* PAGE 3 - GENERAL INFORMATION */}
                <div className="mb-6 p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                    <h4 className="font-bold text-gray-900 mb-4">General Information (Page 3)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">The Market Value of Above Property Is</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.theMarketValueOfAbovePropertyIs || ""} onChange={(e) => handleValuationChange('theMarketValueOfAbovePropertyIs', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">The Realisable Value of Above Property Is</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.theRealisableValueOfAbovePropertyIs || ""} onChange={(e) => handleValuationChange('theRealisableValueOfAbovePropertyIs', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">The Insurable Value of Above Property Is</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.theInsurableValueOfAbovePropertyIs || ""} onChange={(e) => handleValuationChange('theInsurableValueOfAbovePropertyIs', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Date</Label>
                            <Input type="date" value={formData.pdfDetails?.date || ""} onChange={(e) => handleValuationChange('date', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Signature of Branch Manager</Label>
                            <Input placeholder="e.g., Signature" value={formData.pdfDetails?.signatureOfBranchManagerWithOfficeSeal || ""} onChange={(e) => handleValuationChange('signatureOfBranchManagerWithOfficeSeal', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Signature of Approver</Label>
                            <Input placeholder="e.g., Signature" value={formData.pdfDetails?.shashilantRDhumalSignatureOfApprover || ""} onChange={(e) => handleValuationChange('shashilantRDhumalSignatureOfApprover', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 mt-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Property Inspection Details</Label>
                            <Textarea placeholder="Inspected property details" value={formData.pdfDetails?.theUndersignedHasInspectedThePropertyDetailedInTheValuationReportCrossVerifyTheFollowingDetailsAndFoundToBeAccurate || ""} onChange={(e) => handleValuationChange('theUndersignedHasInspectedThePropertyDetailedInTheValuationReportCrossVerifyTheFollowingDetailsAndFoundToBeAccurate', e.target.value)} disabled={!canEdit} className="text-xs rounded-lg border border-neutral-300 py-1 px-2" rows="2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Property Market Value Date</Label>
                            <Input placeholder="e.g., Market value date" value={formData.pdfDetails?.thePropertyIsReasonablyMarketValueOn || ""} onChange={(e) => handleValuationChange('thePropertyIsReasonablyMarketValueOn', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Inspection and Fair Market Value</Label>
                            <Input placeholder="e.g., Fair market value details" value={formData.pdfDetails?.theUndersignedHasInspectedAndSatisfiedThatTheFairAndReasonableMarketValueOn || ""} onChange={(e) => handleValuationChange('theUndersignedHasInspectedAndSatisfiedThatTheFairAndReasonableMarketValueOn', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                </div>

                {/* PAGE 4 - ABSTRACT VALUES */}
                <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                    <h4 className="font-bold text-gray-900 mb-4">Abstract Values (Page 4)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Abstract Land</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.abstractLand || ""} onChange={(e) => handleValuationChange('abstractLand', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Abstract Building</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.abstractBuilding || ""} onChange={(e) => handleValuationChange('abstractBuilding', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Abstract Extra Items</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.abstractExtraItems || ""} onChange={(e) => handleValuationChange('abstractExtraItems', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Abstract Amenities</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.abstractAmenities || ""} onChange={(e) => handleValuationChange('abstractAmenities', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Abstract Miscellaneous</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.abstractMiscellaneous || ""} onChange={(e) => handleValuationChange('abstractMiscellaneous', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Abstract Services</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.abstractServices || ""} onChange={(e) => handleValuationChange('abstractServices', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Abstract Total Value</Label>
                            <Input placeholder="e.g., Total Value" value={formData.pdfDetails?.abstractTotalValue || ""} onChange={(e) => handleValuationChange('abstractTotalValue', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">As Per Appraisal Opinion</Label>
                            <Textarea placeholder="Opinion" value={formData.pdfDetails?.asAResultOfMyAppraisalAndAnalysisItIsMyConsideredOpinionThatThePresentFairMarketValue || ""} onChange={(e) => handleValuationChange('asAResultOfMyAppraisalAndAnalysisItIsMyConsideredOpinionThatThePresentFairMarketValue', e.target.value)} disabled={!canEdit} className="text-xs rounded-lg border border-neutral-300 py-1 px-2" rows="2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Value as on Valuation Date</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.valueOfTheAbovePropertyAsOnTheValuationDateIs || ""} onChange={(e) => handleValuationChange('valueOfTheAbovePropertyAsOnTheValuationDateIs', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Pre Valuation Rate Percentage</Label>
                            <Input placeholder="e.g., Percentage" value={formData.pdfDetails?.preValuationRatePercentageWithDeductionWithRespectToTheAgreementValuePropertyDeed || ""} onChange={(e) => handleValuationChange('preValuationRatePercentageWithDeductionWithRespectToTheAgreementValuePropertyDeed', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                </div>

                {/* PAGE 5 - PART A SERVICES DETAILS */}
                <div className="mb-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <h4 className="font-bold text-gray-900 mb-4">Part A - Services (Page 5)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Sr. No.</Label>
                            <Input placeholder="e.g., 1" value={formData.pdfDetails?.srNo || ""} onChange={(e) => handleValuationChange('srNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Description</Label>
                            <Input placeholder="e.g., Service" value={formData.pdfDetails?.description1 || ""} onChange={(e) => handleValuationChange('description1', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Amount (₹)</Label>
                            <Input placeholder="e.g., Amount" value={formData.pdfDetails?.amountInRupees1 || ""} onChange={(e) => handleValuationChange('amountInRupees1', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h5 className="font-semibold text-gray-800 text-sm">Service Items (12 rows)</h5>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-900">Sr. No. {i}</Label>
                                    <Input placeholder={`${i}`} value={formData.pdfDetails?.[`part1SrNo${i}`] || ""} onChange={(e) => handleValuationChange(`part1SrNo${i}`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-900">Description {i}</Label>
                                    <Input placeholder="e.g., Service item" value={formData.pdfDetails?.[`part1Description${i}`] || ""} onChange={(e) => handleValuationChange(`part1Description${i}`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-900">Amount {i}</Label>
                                    <Input placeholder="e.g., Amount" value={formData.pdfDetails?.[`part1Amount${i}`] || ""} onChange={(e) => handleValuationChange(`part1Amount${i}`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PAGE 6 - PART B AMENITIES */}
                <div className="mb-6 p-6 bg-pink-50 rounded-2xl border border-pink-100">
                    <h4 className="font-bold text-gray-900 mb-4">Part B - Amenities (Page 6)</h4>
                    <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Sr. No.</Label>
                                <Input placeholder="Sr. No." value={formData.pdfDetails?.part2SrNo || ""} onChange={(e) => handleValuationChange('part2SrNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Description</Label>
                                <Input placeholder="Description" value={formData.pdfDetails?.part2Description || ""} onChange={(e) => handleValuationChange('part2Description', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Workbeds</Label>
                                <Input placeholder="Workbeds" value={formData.pdfDetails?.part2Workbeds || ""} onChange={(e) => handleValuationChange('part2Workbeds', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                        </div>
                    </div>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Item {i} Description</Label>
                                <Input placeholder="Description" value={formData.pdfDetails?.[`part2Item${i}Description`] || ""} onChange={(e) => handleValuationChange(`part2Item${i}Description`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Item {i} Amount</Label>
                                <Input placeholder="Amount" value={formData.pdfDetails?.[`part2Item${i}Amount`] || ""} onChange={(e) => handleValuationChange(`part2Item${i}Amount`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                        </div>
                    ))}
                    <div className="space-y-1 mt-3">
                        <Label className="text-xs font-bold text-gray-900">Part B Total</Label>
                        <Input placeholder="Total" value={formData.pdfDetails?.part2Total || ""} onChange={(e) => handleValuationChange('part2Total', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                    </div>
                </div>

                {/* PAGE 7 - PART C MISCELLANEOUS */}
                <div className="mb-6 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                    <h4 className="font-bold text-gray-900 mb-4">Part C - Miscellaneous (Page 7)</h4>
                    <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Sr. No.</Label>
                                <Input placeholder="Sr. No." value={formData.pdfDetails?.part3SrNo || ""} onChange={(e) => handleValuationChange('part3SrNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Description</Label>
                                <Input placeholder="Description" value={formData.pdfDetails?.part3Description || ""} onChange={(e) => handleValuationChange('part3Description', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                        </div>
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Item {i} Description</Label>
                                <Input placeholder="Description" value={formData.pdfDetails?.[`part3Item${i}Description`] || ""} onChange={(e) => handleValuationChange(`part3Item${i}Description`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Item {i} Amount</Label>
                                <Input placeholder="Amount" value={formData.pdfDetails?.[`part3Item${i}Amount`] || ""} onChange={(e) => handleValuationChange(`part3Item${i}Amount`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                        </div>
                    ))}
                    <div className="space-y-1 mt-3">
                        <Label className="text-xs font-bold text-gray-900">Part C Total</Label>
                        <Input placeholder="Total" value={formData.pdfDetails?.part3Total || ""} onChange={(e) => handleValuationChange('part3Total', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                    </div>
                </div>

                {/* PAGE 8 - BUILDING DETAILS & FIXTURES */}
                <div className="mb-6 p-6 bg-teal-50 rounded-2xl border border-teal-100">
                    <h4 className="font-bold text-gray-900 mb-4">Building Details & Fixtures (Page 8)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Compound Wall</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.compoundWall || ""} onChange={(e) => handleValuationChange('compoundWall', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Height</Label>
                            <Input placeholder="e.g., Height" value={formData.pdfDetails?.height || ""} onChange={(e) => handleValuationChange('height', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Length</Label>
                            <Input placeholder="e.g., Length" value={formData.pdfDetails?.length || ""} onChange={(e) => handleValuationChange('length', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Type of Construction</Label>
                            <Input placeholder="e.g., Type" value={formData.pdfDetails?.typeOfConstruction || ""} onChange={(e) => handleValuationChange('typeOfConstruction', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Electrical Installation</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.electricalInstallation || ""} onChange={(e) => handleValuationChange('electricalInstallation', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Type of Wiring</Label>
                            <Input placeholder="e.g., Type" value={formData.pdfDetails?.typeOfWiring || ""} onChange={(e) => handleValuationChange('typeOfWiring', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Class of Fittings</Label>
                            <Input placeholder="e.g., Class" value={formData.pdfDetails?.classOfFittings || ""} onChange={(e) => handleValuationChange('classOfFittings', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Number of Light Points</Label>
                            <Input placeholder="e.g., Number" value={formData.pdfDetails?.numberOfLightPoints || ""} onChange={(e) => handleValuationChange('numberOfLightPoints', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Far Plugs</Label>
                            <Input placeholder="e.g., Number" value={formData.pdfDetails?.farPlugs || ""} onChange={(e) => handleValuationChange('farPlugs', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Spare Plug</Label>
                            <Input placeholder="e.g., Number" value={formData.pdfDetails?.sparePlug || ""} onChange={(e) => handleValuationChange('sparePlug', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Any Other Electrical Item</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.anyOtherElectricalItem || ""} onChange={(e) => handleValuationChange('anyOtherElectricalItem', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Plumbing Installation</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.plumbingInstallation || ""} onChange={(e) => handleValuationChange('plumbingInstallation', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">No. Water Class and Taps</Label>
                            <Input placeholder="e.g., Number" value={formData.pdfDetails?.numberOfWaterClassAndTaps || ""} onChange={(e) => handleValuationChange('numberOfWaterClassAndTaps', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">No. Wash Basins</Label>
                            <Input placeholder="e.g., Number" value={formData.pdfDetails?.noWashBasins || ""} onChange={(e) => handleValuationChange('noWashBasins', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">No. Urinals</Label>
                            <Input placeholder="e.g., Number" value={formData.pdfDetails?.noUrinals || ""} onChange={(e) => handleValuationChange('noUrinals', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">No. Bathtubs</Label>
                            <Input placeholder="e.g., Number" value={formData.pdfDetails?.noOfBathtubs || ""} onChange={(e) => handleValuationChange('noOfBathtubs', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Water Meter Taps Etc</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.waterMeterTapsEtc || ""} onChange={(e) => handleValuationChange('waterMeterTapsEtc', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Any Other Plumbing Fixture</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.anyOtherPlumbingFixture || ""} onChange={(e) => handleValuationChange('anyOtherPlumbingFixture', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                </div>

                {/* PAGE 9 - ORNAMENTAL & EXTRA ITEMS */}
                <div className="mb-6 p-6 bg-cyan-50 rounded-2xl border border-cyan-100">
                    <h4 className="font-bold text-gray-900 mb-4">Ornamental & Extra Items (Page 9)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Ornamental Floor</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.ornamentalFloor || ""} onChange={(e) => handleValuationChange('ornamentalFloor', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Ornamental Floor Amount</Label>
                            <Input placeholder="e.g., Amount" value={formData.pdfDetails?.ornamentalFloorAmount || ""} onChange={(e) => handleValuationChange('ornamentalFloorAmount', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Stucco Veranda</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.stuccoVeranda || ""} onChange={(e) => handleValuationChange('stuccoVeranda', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Stucco Veranda Amount</Label>
                            <Input placeholder="e.g., Amount" value={formData.pdfDetails?.stuccoVerandaAmount || ""} onChange={(e) => handleValuationChange('stuccoVerandaAmount', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Sheet Grills</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.sheetGrills || ""} onChange={(e) => handleValuationChange('sheetGrills', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Sheet Grills Amount</Label>
                            <Input placeholder="e.g., Amount" value={formData.pdfDetails?.sheetGrillsAmount || ""} onChange={(e) => handleValuationChange('sheetGrillsAmount', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Overhead Water Tank</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.overheadWaterTank || ""} onChange={(e) => handleValuationChange('overheadWaterTank', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Overhead Water Tank Amount</Label>
                            <Input placeholder="e.g., Amount" value={formData.pdfDetails?.overheadWaterTankAmount || ""} onChange={(e) => handleValuationChange('overheadWaterTankAmount', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Extra Shed Possible Gates</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.extraShedPossibleGates || ""} onChange={(e) => handleValuationChange('extraShedPossibleGates', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Extra Shed Possible Gates Amount</Label>
                            <Input placeholder="e.g., Amount" value={formData.pdfDetails?.extraShedPossibleGatesAmount || ""} onChange={(e) => handleValuationChange('extraShedPossibleGatesAmount', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                </div>

                {/* PAGE 10 - PART F SERVICES */}
                <div className="mb-6 p-6 bg-rose-50 rounded-2xl border border-rose-100">
                    <h4 className="font-bold text-gray-900 mb-4">Part F - Services (Page 10)</h4>
                    <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Sr. No.</Label>
                                <Input placeholder="Sr. No." value={formData.pdfDetails?.partFSrNo || ""} onChange={(e) => handleValuationChange('partFSrNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Description</Label>
                                <Input placeholder="Description" value={formData.pdfDetails?.partFDescription || ""} onChange={(e) => handleValuationChange('partFDescription', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Portico</Label>
                                <Input placeholder="Portico" value={formData.pdfDetails?.partFPortico || ""} onChange={(e) => handleValuationChange('partFPortico', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                        </div>
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Item {i} Description</Label>
                                <Input placeholder="Description" value={formData.pdfDetails?.[`partFItem${i}Description`] || ""} onChange={(e) => handleValuationChange(`partFItem${i}Description`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Item {i} Amount</Label>
                                <Input placeholder="Amount" value={formData.pdfDetails?.[`partFItem${i}Amount`] || ""} onChange={(e) => handleValuationChange(`partFItem${i}Amount`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                        </div>
                    ))}
                    <div className="space-y-1 mt-3">
                        <Label className="text-xs font-bold text-gray-900">Part F Total</Label>
                        <Input placeholder="Total" value={formData.pdfDetails?.partFTotal || ""} onChange={(e) => handleValuationChange('partFTotal', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                    </div>
                </div>

                {/* PAGE 11 - PART C EXTRA ITEMS */}
                <div className="mb-6 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <h4 className="font-bold text-gray-900 mb-4">Part C - Extra Items (Page 11)</h4>
                    <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Sr. No.</Label>
                                <Input placeholder="Sr. No." value={formData.pdfDetails?.partCExtraSrNo || ""} onChange={(e) => handleValuationChange('partCExtraSrNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Description</Label>
                                <Input placeholder="Description" value={formData.pdfDetails?.partCExtraDescription || ""} onChange={(e) => handleValuationChange('partCExtraDescription', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Works Items</Label>
                                <Input placeholder="Works Items" value={formData.pdfDetails?.partCExtraWorksItems || ""} onChange={(e) => handleValuationChange('partCExtraWorksItems', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                        </div>
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Item {i} Description</Label>
                                <Input placeholder="Description" value={formData.pdfDetails?.[`partCExtraItem${i}Description`] || ""} onChange={(e) => handleValuationChange(`partCExtraItem${i}Description`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Item {i} Amount</Label>
                                <Input placeholder="Amount" value={formData.pdfDetails?.[`partCExtraItem${i}Amount`] || ""} onChange={(e) => handleValuationChange(`partCExtraItem${i}Amount`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                        </div>
                    ))}
                    <div className="space-y-1 mt-3">
                        <Label className="text-xs font-bold text-gray-900">Part C Extra Total</Label>
                        <Input placeholder="Total" value={formData.pdfDetails?.partCExtraTotal || ""} onChange={(e) => handleValuationChange('partCExtraTotal', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                    </div>
                </div>

                {/* PAGE 12 - PART E MISCELLANEOUS */}
                <div className="mb-6 p-6 bg-violet-50 rounded-2xl border border-violet-100">
                    <h4 className="font-bold text-gray-900 mb-4">Part E - Miscellaneous (Page 12)</h4>
                    <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Sr. No.</Label>
                                <Input placeholder="Sr. No." value={formData.pdfDetails?.partESrNo || ""} onChange={(e) => handleValuationChange('partESrNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Description</Label>
                                <Input placeholder="Description" value={formData.pdfDetails?.partEDescription || ""} onChange={(e) => handleValuationChange('partEDescription', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                        </div>
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Item {i} Description</Label>
                                <Input placeholder="Description" value={formData.pdfDetails?.[`partEItem${i}Description`] || ""} onChange={(e) => handleValuationChange(`partEItem${i}Description`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-gray-900">Item {i} Amount</Label>
                                <Input placeholder="Amount" value={formData.pdfDetails?.[`partEItem${i}Amount`] || ""} onChange={(e) => handleValuationChange(`partEItem${i}Amount`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                            </div>
                        </div>
                    ))}
                    <div className="space-y-1 mt-3">
                        <Label className="text-xs font-bold text-gray-900">Part E Total</Label>
                        <Input placeholder="Total" value={formData.pdfDetails?.partETotal || ""} onChange={(e) => handleValuationChange('partETotal', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                    </div>
                </div>

                {/* PAGE 13 - BUILDING CONSTRUCTION DETAILS */}
                <div className="mb-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <h4 className="font-bold text-gray-900 mb-4">Building Construction Floor-wise (Page 13)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Sr. No.</Label>
                            <Input placeholder="Sr. No." value={formData.pdfDetails?.buildingConstructionSrNo || ""} onChange={(e) => handleValuationChange('buildingConstructionSrNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Description</Label>
                            <Input placeholder="Description" value={formData.pdfDetails?.buildingConstructionDescription || ""} onChange={(e) => handleValuationChange('buildingConstructionDescription', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Built Up Area</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.builtUpArea || ""} onChange={(e) => handleValuationChange('builtUpArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {['Ground', '1st', '2nd', '3rd', '4th', '5th', '6th', 'Basement', 'GlassHouse'].map((floor, idx) => (
                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-900">{floor} Floor Area</Label>
                                    <Input placeholder="Area" value={formData.pdfDetails?.[`${floor.toLowerCase()}Floor`] || ""} onChange={(e) => handleValuationChange(`${floor.toLowerCase()}Floor`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-900">{floor} Floor Rate</Label>
                                    <Input placeholder="Rate" value={formData.pdfDetails?.[`${floor.toLowerCase()}FloorRate`] || ""} onChange={(e) => handleValuationChange(`${floor.toLowerCase()}FloorRate`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-gray-900">{floor} Floor Value</Label>
                                    <Input placeholder="Value" value={formData.pdfDetails?.[`${floor.toLowerCase()}FloorValue`] || ""} onChange={(e) => handleValuationChange(`${floor.toLowerCase()}FloorValue`, e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-1 mt-4">
                        <Label className="text-xs font-bold text-gray-900">Total Area Building</Label>
                        <Input placeholder="Total Area" value={formData.pdfDetails?.totalAreaBuilding || ""} onChange={(e) => handleValuationChange('totalAreaBuilding', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                    </div>
                </div>

                {/* PAGE 13 - MEASUREMENT CARPET AREA */}
                <div className="mb-6 p-6 bg-sky-50 rounded-2xl border border-sky-100">
                    <h4 className="font-bold text-gray-900 mb-4">Measurement Carpet Area (Page 13)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Carpet Area Sqft</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.carpetAreaSqft || ""} onChange={(e) => handleValuationChange('carpetAreaSqft', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Basement Floor Sqft</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.basementFloorSqft || ""} onChange={(e) => handleValuationChange('basementFloorSqft', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Ground Floor Sqft</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.groundFloorSqftMeasure || ""} onChange={(e) => handleValuationChange('groundFloorSqftMeasure', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Ground Floor Amount (₹)</Label>
                            <Input placeholder="e.g., Amount" value={formData.pdfDetails?.groundFloorAmountInRupees || ""} onChange={(e) => handleValuationChange('groundFloorAmountInRupees', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Service Floor Carpet Area</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.serviceFloorCarpetArea || ""} onChange={(e) => handleValuationChange('serviceFloorCarpetArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Trace Area Carpet Area</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.traceAreaCarpetArea || ""} onChange={(e) => handleValuationChange('traceAreaCarpetArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">First Floor Carpet Area</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.firstFloorCarpetArea || ""} onChange={(e) => handleValuationChange('firstFloorCarpetArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Service Floor</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.serviceFloor || ""} onChange={(e) => handleValuationChange('serviceFloor', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Service Floor Rate</Label>
                            <Input placeholder="e.g., Rate" value={formData.pdfDetails?.serviceFloorRate || ""} onChange={(e) => handleValuationChange('serviceFloorRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Service Floor Value</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.serviceFloorValue || ""} onChange={(e) => handleValuationChange('serviceFloorValue', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                </div>

                {/* PAGE 14 - PLOT AREA & BUILT UP AREA */}
                <div className="mb-6 p-6 bg-lime-50 rounded-2xl border border-lime-100">
                    <h4 className="font-bold text-gray-900 mb-4">Plot Area & Built Up Area (Page 14)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">West</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.west || ""} onChange={(e) => handleValuationChange('west', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Extent Area and Built Up Area</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.extentAreaAndBuildUpArea || ""} onChange={(e) => handleValuationChange('extentAreaAndBuildUpArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Plot Area as Per Sketched Plan</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.plotAreaAsPerSketchedPlan || ""} onChange={(e) => handleValuationChange('plotAreaAsPerSketchedPlan', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Plot Area in Built Up Area Sqft</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.plotAreaInBuildUpAreaInSqft || ""} onChange={(e) => handleValuationChange('plotAreaInBuildUpAreaInSqft', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Plot Area in Sqft</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.plotAreaInSqft || ""} onChange={(e) => handleValuationChange('plotAreaInSqft', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Build Up Area as Per Sketched Plan</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.buildUpAreaAsPerSketchedPlan || ""} onChange={(e) => handleValuationChange('buildUpAreaAsPerSketchedPlan', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Building Specifications Plot Layout</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.buildingSpecificationsPlotLayout || ""} onChange={(e) => handleValuationChange('buildingSpecificationsPlotLayout', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Floor Area Sqft</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.floorAreaSqft || ""} onChange={(e) => handleValuationChange('floorAreaSqft', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Rate of Construction Per Sqft</Label>
                            <Input placeholder="e.g., Rate" value={formData.pdfDetails?.rateOfConstructionPerSqft || ""} onChange={(e) => handleValuationChange('rateOfConstructionPerSqft', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Value of Construction</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.valueOfConstruction || ""} onChange={(e) => handleValuationChange('valueOfConstruction', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Rate of Construction Values</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.rateOfConstructionValues || ""} onChange={(e) => handleValuationChange('rateOfConstructionValues', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Building Specs Plot Layout Sqft Rate Value</Label>
                            <Input placeholder="e.g., Value" value={formData.pdfDetails?.buildingSpecificationsPlotLayoutSqfRateValue || ""} onChange={(e) => handleValuationChange('buildingSpecificationsPlotLayoutSqfRateValue', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Deed Built Up Area Sqft</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.deedBuiltUpAreaSqft || ""} onChange={(e) => handleValuationChange('deedBuiltUpAreaSqft', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Estimated Repair Cost of Construction</Label>
                            <Input placeholder="e.g., Cost" value={formData.pdfDetails?.estimatedRepairCostOfConstruction || ""} onChange={(e) => handleValuationChange('estimatedRepairCostOfConstruction', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Floor Area Sqft Land</Label>
                            <Input placeholder="e.g., Sq. ft." value={formData.pdfDetails?.floorAreaSqftLand || ""} onChange={(e) => handleValuationChange('floorAreaSqftLand', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Rate Per Sqft Land</Label>
                            <Input placeholder="e.g., Rate" value={formData.pdfDetails?.ratePerSqftLand || ""} onChange={(e) => handleValuationChange('ratePerSqftLand', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Interior 0% Land</Label>
                            <Input placeholder="e.g., Percentage" value={formData.pdfDetails?.interior0PercentLand || ""} onChange={(e) => handleValuationChange('interior0PercentLand', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Entrance Canopy Area</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.entranceCanopyArea || ""} onChange={(e) => handleValuationChange('entranceCanopyArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                </div>

                {/* PAGE 15 - PROPERTY DETAILS */}
                <div className="mb-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h4 className="font-bold text-gray-900 mb-4">Property Details (Page 15)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Location of Property</Label>
                            <Input placeholder="e.g., Location" value={formData.pdfDetails?.locationOfProperty || ""} onChange={(e) => handleValuationChange('locationOfProperty', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Plot No.</Label>
                            <Input placeholder="e.g., Plot No." value={formData.pdfDetails?.plotNo || ""} onChange={(e) => handleValuationChange('plotNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Survey No.</Label>
                            <Input placeholder="e.g., Survey No." value={formData.pdfDetails?.surveyNo || ""} onChange={(e) => handleValuationChange('surveyNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Door No.</Label>
                            <Input placeholder="e.g., Door No." value={formData.pdfDetails?.doorNo || ""} onChange={(e) => handleValuationChange('doorNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Taluka</Label>
                            <Input placeholder="e.g., Taluka" value={formData.pdfDetails?.taluka || ""} onChange={(e) => handleValuationChange('taluka', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Mandal</Label>
                            <Input placeholder="e.g., Mandal" value={formData.pdfDetails?.mandal || ""} onChange={(e) => handleValuationChange('mandal', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">District</Label>
                            <Input placeholder="e.g., District" value={formData.pdfDetails?.district || ""} onChange={(e) => handleValuationChange('district', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">City/Town</Label>
                            <Input placeholder="e.g., City" value={formData.pdfDetails?.cityTown || ""} onChange={(e) => handleValuationChange('cityTown', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Residential Area</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.residentialArea || ""} onChange={(e) => handleValuationChange('residentialArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Commercial Area</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.commercialArea || ""} onChange={(e) => handleValuationChange('commercialArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Industrial Area</Label>
                            <Input placeholder="e.g., Area" value={formData.pdfDetails?.industrialArea || ""} onChange={(e) => handleValuationChange('industrialArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Classification of Area</Label>
                            <Input placeholder="e.g., Classification" value={formData.pdfDetails?.classificationOfArea || ""} onChange={(e) => handleValuationChange('classificationOfArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Urban/Rural</Label>
                            <Input placeholder="e.g., Urban/Rural" value={formData.pdfDetails?.urbanRural || ""} onChange={(e) => handleValuationChange('urbanRural', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Mile Semi Urban</Label>
                            <Input placeholder="e.g., Mile" value={formData.pdfDetails?.mileSemUrban || ""} onChange={(e) => handleValuationChange('mileSemUrban', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Municipal Corporation As Per</Label>
                            <Input placeholder="e.g., Municipal" value={formData.pdfDetails?.municipalCorporationAsPer || ""} onChange={(e) => handleValuationChange('municipalCorporationAsPer', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                    <div className="space-y-1 mt-4">
                        <Label className="text-xs font-bold text-gray-900">Brief Description of Property</Label>
                        <Textarea placeholder="Brief description" value={formData.pdfDetails?.briefDescriptionOfProperty || ""} onChange={(e) => handleValuationChange('briefDescriptionOfProperty', e.target.value)} disabled={!canEdit} className="text-xs rounded-lg border border-neutral-300 py-1 px-2" rows="2" />
                    </div>
                </div>

                {/* BOUNDARIES OF PROPERTY */}
                <div className="mb-6 p-6 bg-red-50 rounded-2xl border border-red-100">
                    <h4 className="font-bold text-gray-900 mb-4">Boundaries of Property</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Boundaries of the Property</Label>
                            <Input placeholder="e.g., Description" value={formData.pdfDetails?.boundariesOfTheProperty || ""} onChange={(e) => handleValuationChange('boundariesOfTheProperty', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">North Boundary</Label>
                            <Input placeholder="e.g., Boundary" value={formData.pdfDetails?.northBoundary || ""} onChange={(e) => handleValuationChange('northBoundary', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">South Boundary</Label>
                            <Input placeholder="e.g., Boundary" value={formData.pdfDetails?.southBoundary || ""} onChange={(e) => handleValuationChange('southBoundary', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">East Boundary</Label>
                            <Input placeholder="e.g., Boundary" value={formData.pdfDetails?.eastBoundary || ""} onChange={(e) => handleValuationChange('eastBoundary', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">West Boundary</Label>
                            <Input placeholder="e.g., Boundary" value={formData.pdfDetails?.westBoundary || ""} onChange={(e) => handleValuationChange('westBoundary', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                </div>

                {/* PAGE 16 - APARTMENT & STRUCTURE */}
                <div className="mb-6 p-6 bg-fuchsia-50 rounded-2xl border border-fuchsia-100">
                    <h4 className="font-bold text-gray-900 mb-4">Apartment Building & Nature (Page 16)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Classification of Locality</Label>
                            <Input placeholder="e.g., Classification" value={formData.pdfDetails?.classificationOfLocality || ""} onChange={(e) => handleValuationChange('classificationOfLocality', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Development of Surrounding Areas</Label>
                            <Input placeholder="e.g., Development" value={formData.pdfDetails?.developmentOfSurroundingAreas || ""} onChange={(e) => handleValuationChange('developmentOfSurroundingAreas', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Possibility of Future Housing Mixing</Label>
                            <Input placeholder="e.g., Possibility" value={formData.pdfDetails?.possibilityOfFutureHousingMixing || ""} onChange={(e) => handleValuationChange('possibilityOfFutureHousingMixing', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Feasibility of 1 to 2 Kms</Label>
                            <Input placeholder="e.g., Feasibility" value={formData.pdfDetails?.feasibilityOf1To2Kms || ""} onChange={(e) => handleValuationChange('feasibilityOf1To2Kms', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Type of Structure Material</Label>
                            <Input placeholder="e.g., Material" value={formData.pdfDetails?.typeOfStructureMaterial || ""} onChange={(e) => handleValuationChange('typeOfStructureMaterial', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Share of Land</Label>
                            <Input placeholder="e.g., Share" value={formData.pdfDetails?.shareOfLand || ""} onChange={(e) => handleValuationChange('shareOfLand', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Type of Use</Label>
                            <Input placeholder="e.g., Type" value={formData.pdfDetails?.typeOfUseToWhichItCanBePut || ""} onChange={(e) => handleValuationChange('typeOfUseToWhichItCanBePut', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Any Usage Restriction</Label>
                            <Input placeholder="e.g., Restriction" value={formData.pdfDetails?.anyUsageRestriction || ""} onChange={(e) => handleValuationChange('anyUsageRestriction', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Is Plot in Town Planning</Label>
                            <Input placeholder="e.g., Yes/No" value={formData.pdfDetails?.isPlotInTownPlanning || ""} onChange={(e) => handleValuationChange('isPlotInTownPlanning', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Corner Plot or Interior Facilities</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.cornerPlotOrInteriorFacilities || ""} onChange={(e) => handleValuationChange('cornerPlotOrInteriorFacilities', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Year of Road Availability</Label>
                            <Input placeholder="e.g., Year" value={formData.pdfDetails?.yearOfRoadAvailability || ""} onChange={(e) => handleValuationChange('yearOfRoadAvailability', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Water Road Available Below or Above</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.waterRoadAvailableBelowOrAbove || ""} onChange={(e) => handleValuationChange('waterRoadAvailableBelowOrAbove', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Is A Land Area</Label>
                            <Input placeholder="e.g., Yes/No" value={formData.pdfDetails?.isALandArea || ""} onChange={(e) => handleValuationChange('isALandArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Water Sewerage System</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.waterSewerageSystem || ""} onChange={(e) => handleValuationChange('waterSewerageSystem', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Apartment Nature</Label>
                            <Input placeholder="e.g., Nature" value={formData.pdfDetails?.apartmentNature || ""} onChange={(e) => handleValuationChange('apartmentNature', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Apartment Location</Label>
                            <Input placeholder="e.g., Location" value={formData.pdfDetails?.apartmentLocation || ""} onChange={(e) => handleValuationChange('apartmentLocation', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Apartment CTS No</Label>
                            <Input placeholder="e.g., CTS No." value={formData.pdfDetails?.apartmentCTSNo || ""} onChange={(e) => handleValuationChange('apartmentCTSNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Apartment Sector No</Label>
                            <Input placeholder="e.g., Sector No." value={formData.pdfDetails?.apartmentSectorNo || ""} onChange={(e) => handleValuationChange('apartmentSectorNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Apartment Block No</Label>
                            <Input placeholder="e.g., Block No." value={formData.pdfDetails?.apartmentBlockNo || ""} onChange={(e) => handleValuationChange('apartmentBlockNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Apartment Ward No</Label>
                            <Input placeholder="e.g., Ward No." value={formData.pdfDetails?.apartmentWardNo || ""} onChange={(e) => handleValuationChange('apartmentWardNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Apartment Village/Municipality/County</Label>
                            <Input placeholder="e.g., Village" value={formData.pdfDetails?.apartmentVillageMunicipalityCounty || ""} onChange={(e) => handleValuationChange('apartmentVillageMunicipalityCounty', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Apartment Door No/Street Road</Label>
                            <Input placeholder="e.g., Door No." value={formData.pdfDetails?.apartmentDoorNoStreetRoad || ""} onChange={(e) => handleValuationChange('apartmentDoorNoStreetRoad', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Apartment Pin Code</Label>
                            <Input placeholder="e.g., Pin Code" value={formData.pdfDetails?.apartmentPinCode || ""} onChange={(e) => handleValuationChange('apartmentPinCode', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Number of Dwelling Units in Building</Label>
                            <Input placeholder="e.g., Number" value={formData.pdfDetails?.numberOfDwellingUnitsInBuilding || ""} onChange={(e) => handleValuationChange('numberOfDwellingUnitsInBuilding', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Description of Locality</Label>
                            <Input placeholder="e.g., Description" value={formData.pdfDetails?.descriptionOfLocalityResidentialCommercialMixed || ""} onChange={(e) => handleValuationChange('descriptionOfLocalityResidentialCommercialMixed', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                    </div>
                </div>

                {/* PAGE 17 - APPROVAL & AUTHORIZATION */}
                <div className="mb-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-gray-900 mb-4">Approval & Authorization (Page 17)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Construction As Per</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.constructionAsPer || ""} onChange={(e) => handleValuationChange('constructionAsPer', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Panchayat Municipality Search Report</Label>
                            <Input placeholder="e.g., Report" value={formData.pdfDetails?.panchayatMunicipalitySearchReport || ""} onChange={(e) => handleValuationChange('panchayatMunicipalitySearchReport', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Water Covered Under Sale Deeds</Label>
                            <Input placeholder="e.g., Covered/Not Covered" value={formData.pdfDetails?.watercoveredUnderSaleDeeds || ""} onChange={(e) => handleValuationChange('watercoveredUnderSaleDeeds', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Government Enactments Or Utilities</Label>
                            <Input placeholder="e.g., Details" value={formData.pdfDetails?.governmentEnctmentsOrUtilitiesScheduledArea || ""} onChange={(e) => handleValuationChange('governmentEnctmentsOrUtilitiesScheduledArea', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Date Issue and Validity of Approved Plan</Label>
                            <Input type="date" value={formData.pdfDetails?.dateIssueAndValidityOfApprovedPlan || ""} onChange={(e) => handleValuationChange('dateIssueAndValidityOfApprovedPlan', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Whether Generous On Authority</Label>
                            <Input placeholder="e.g., Yes/No" value={formData.pdfDetails?.whetherGenerousOnAuthority || ""} onChange={(e) => handleValuationChange('whetherGenerousOnAuthority', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Any Other Comments or Authority</Label>
                            <Input placeholder="e.g., Comments" value={formData.pdfDetails?.anyOtherCommentsOrAuthorityApprovedPlan || ""} onChange={(e) => handleValuationChange('anyOtherCommentsOrAuthorityApprovedPlan', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Purpose For Valuation</Label>
                            <Input placeholder="e.g., Purpose" value={formData.pdfDetails?.purposeForValuation || ""} onChange={(e) => handleValuationChange('purposeForValuation', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Date of Inspection</Label>
                            <Input type="date" value={formData.pdfDetails?.dateOfInspection || ""} onChange={(e) => handleValuationChange('dateOfInspection', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Date On Which Valuation Is Made</Label>
                            <Input type="date" value={formData.pdfDetails?.dateOnWhichValuationIsMade || ""} onChange={(e) => handleValuationChange('dateOnWhichValuationIsMade', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">List of Documents Produced For Perusal</Label>
                            <Textarea placeholder="e.g., Documents" value={formData.pdfDetails?.listOfDocumentsProducedForPerusal || ""} onChange={(e) => handleValuationChange('listOfDocumentsProducedForPerusal', e.target.value)} disabled={!canEdit} className="text-xs rounded-lg border border-neutral-300 py-1 px-2" rows="2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Protocol Documents</Label>
                            <Input placeholder="e.g., Documents" value={formData.pdfDetails?.protocolDocuments || ""} onChange={(e) => handleValuationChange('protocolDocuments', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Sanctioned Plan Status</Label>
                            <Input placeholder="e.g., Status" value={formData.pdfDetails?.sanctionedPlanStatus || ""} onChange={(e) => handleValuationChange('sanctionedPlanStatus', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Certificate Number</Label>
                            <Input placeholder="e.g., Certificate No." value={formData.pdfDetails?.certificateNumber || ""} onChange={(e) => handleValuationChange('certificateNumber', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Building Completion Certificate</Label>
                            <Input placeholder="e.g., Certificate" value={formData.pdfDetails?.buildingCompletionCertificate || ""} onChange={(e) => handleValuationChange('buildingCompletionCertificate', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Completion Certificate No</Label>
                            <Input placeholder="e.g., Certificate No." value={formData.pdfDetails?.completionCertificateNo || ""} onChange={(e) => handleValuationChange('completionCertificateNo', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Owner Address Joint Owners</Label>
                            <Textarea placeholder="e.g., Address" value={formData.pdfDetails?.ownerAddressJointOwners || ""} onChange={(e) => handleValuationChange('ownerAddressJointOwners', e.target.value)} disabled={!canEdit} className="text-xs rounded-lg border border-neutral-300 py-1 px-2" rows="2" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-gray-900">Joint Owners Details of Ownership</Label>
                            <Textarea placeholder="e.g., Details" value={formData.pdfDetails?.jointOwnersDeDetailsOfJointOwnership || ""} onChange={(e) => handleValuationChange('jointOwnersDeDetailsOfJointOwnership', e.target.value)} disabled={!canEdit} className="text-xs rounded-lg border border-neutral-300 py-1 px-2" rows="2" />
                        </div>
                    </div>
                </div>
                {/* VALUATION ITEMS TABLE */}
                <div className="mb-6 p-6 bg-rose-50 rounded-2xl border border-rose-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Valuation Details Table</h4>
                    <div className="w-full overflow-x-auto">
                        <table className="min-w-full border-collapse text-xs">
                            <thead>
                                <tr className="bg-rose-100 border border-rose-200">
                                    <th className="px-2 py-3 text-left font-bold text-gray-900 border border-rose-200 min-w-[50px]">Sr. No.</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-900 border border-rose-200 min-w-[200px]">Description</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-900 border border-rose-200 min-w-[120px]">Qty/Sq. ft.</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-900 border border-rose-200 min-w-[140px]">Rate</th>
                                    <th className="px-2 py-3 text-left font-bold text-gray-900 border border-rose-200 min-w-[150px]">Estimated Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Present Value of Flat */}
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-xs font-bold text-center">1</td>
                                    <td className="px-2 py-2 border border-rose-200 text-xs">Present Value of Hard Built up area</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.presentValueQty || ""} onChange={(e) => handleValuationChange('presentValueQty', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.presentValueRate || ""} onChange={(e) => handleValuationChange('presentValueRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.presentValue || ""} onChange={(e) => handleValuationChange('presentValue', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                </tr>
                                {/* Wardrobes */}
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-xs font-bold text-center">2</td>
                                    <td className="px-2 py-2 border border-rose-200 text-xs">Wardrobes</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.wardrobesQty || ""} onChange={(e) => handleValuationChange('wardrobesQty', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.wardrobesRate || ""} onChange={(e) => handleValuationChange('wardrobesRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.wardrobes || ""} onChange={(e) => handleValuationChange('wardrobes', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                </tr>
                                {/* Showcases */}
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-xs font-bold text-center">3</td>
                                    <td className="px-2 py-2 border border-rose-200 text-xs">Show cases, Almirah</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.showcasesQty || ""} onChange={(e) => handleValuationChange('showcasesQty', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.showcasesRate || ""} onChange={(e) => handleValuationChange('showcasesRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.showcases || ""} onChange={(e) => handleValuationChange('showcases', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                </tr>
                                {/* Kitchen Arrangements */}
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-xs font-bold text-center">4</td>
                                    <td className="px-2 py-2 border border-rose-200 text-xs">Kitchen arrangements</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.kitchenArrangementsQty || ""} onChange={(e) => handleValuationChange('kitchenArrangementsQty', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.kitchenArrangementsRate || ""} onChange={(e) => handleValuationChange('kitchenArrangementsRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.kitchenArrangements || ""} onChange={(e) => handleValuationChange('kitchenArrangements', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                </tr>
                                {/* Superficial Finish */}
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-xs font-bold text-center">5</td>
                                    <td className="px-2 py-2 border border-rose-200 text-xs">Superfine Finish</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.superfineFinishQty || ""} onChange={(e) => handleValuationChange('superfineFinishQty', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.superfineFinishRate || ""} onChange={(e) => handleValuationChange('superfineFinishRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.superfineFinish || ""} onChange={(e) => handleValuationChange('superfineFinish', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                </tr>
                                {/* Interiors, Decorations */}
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-xs font-bold text-center">6</td>
                                    <td className="px-2 py-2 border border-rose-200 text-xs">Interior Decorations</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.interiorDecorationsQty || ""} onChange={(e) => handleValuationChange('interiorDecorationsQty', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.interiorDecorationsRate || ""} onChange={(e) => handleValuationChange('interiorDecorationsRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.interiorDecorations || ""} onChange={(e) => handleValuationChange('interiorDecorations', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                </tr>
                                {/* Electrical Deposits */}
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-xs font-bold text-center">7</td>
                                    <td className="px-2 py-2 border border-rose-200 text-xs">Electricity Deposits</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.electricityDepositsQty || ""} onChange={(e) => handleValuationChange('electricityDepositsQty', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.electricityDepositsRate || ""} onChange={(e) => handleValuationChange('electricityDepositsRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.electricityDeposits || ""} onChange={(e) => handleValuationChange('electricityDeposits', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                </tr>
                                {/* Collapsible Gates */}
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-xs font-bold text-center">8</td>
                                    <td className="px-2 py-2 border border-rose-200 text-xs">Collapsible Gates</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.collapsibleGatesQty || ""} onChange={(e) => handleValuationChange('collapsibleGatesQty', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.collapsibleGatesRate || ""} onChange={(e) => handleValuationChange('collapsibleGatesRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.collapsibleGates || ""} onChange={(e) => handleValuationChange('collapsibleGates', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                </tr>
                                {/* Potential Value */}
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-xs font-bold text-center">9</td>
                                    <td className="px-2 py-2 border border-rose-200 text-xs">Potential Value</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.potentialValueQty || ""} onChange={(e) => handleValuationChange('potentialValueQty', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.potentialValueRate || ""} onChange={(e) => handleValuationChange('potentialValueRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.potentialValue || ""} onChange={(e) => handleValuationChange('potentialValue', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                </tr>
                                {/* Others */}
                                <tr className="border border-rose-200">
                                    <td className="px-2 py-2 border border-rose-200 text-xs font-bold text-center">10</td>
                                    <td className="px-2 py-2 border border-rose-200 text-xs">Others</td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.otherItemsQty || ""} onChange={(e) => handleValuationChange('otherItemsQty', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.otherItemsRate || ""} onChange={(e) => handleValuationChange('otherItemsRate', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                    <td className="px-2 py-2 border border-rose-200"><Input type="number" value={formData.pdfDetails?.otherItems || ""} onChange={(e) => handleValuationChange('otherItems', e.target.value)} disabled={!canEdit} className="h-8 text-xs border border-neutral-300 bg-white rounded px-2 w-full" /></td>
                                </tr>
                                {/* Total Row */}
                                <tr className="bg-rose-200 border border-rose-300 font-bold">
                                    <td colSpan="4" className="px-2 py-3 border border-rose-300 text-xs text-right">TOTAL</td>
                                    <td className="px-2 py-3 border border-rose-300 text-xs text-gray-900">{formatIndianCurrency(totalValuation)}</td>
                                </tr>
                                {/* Round Figure Row */}
                                <tr className="bg-orange-200 border border-orange-300 font-bold">
                                    <td colSpan="4" className="px-2 py-3 border border-orange-300 text-xs text-right">ROUND FIGURE</td>
                                    <td className="px-2 py-3 border border-orange-300 text-xs text-gray-900">{formatIndianCurrency(roundFigureTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* VALUE OF FLAT SECTION */}
                <div className="mb-6 p-6 bg-teal-50 rounded-2xl border border-teal-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-base">Value of Flat</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-900">Fair Market Value</Label>
                            <Input
                                type="number"
                                placeholder="Auto-calculated or enter value"
                                value={formData.pdfDetails?.fairMarketValue || ""}
                                onChange={(e) => handleValuationChange('fairMarketValue', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-xs rounded-lg border border-teal-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 w-full"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-900">Realizable Value</Label>
                            <Input
                                type="number"
                                placeholder="Auto-calculated or enter value"
                                value={formData.pdfDetails?.realizableValue || ""}
                                onChange={(e) => handleValuationChange('realizableValue', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-xs rounded-lg border border-teal-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 w-full"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-900">Distress Value</Label>
                            <Input
                                type="number"
                                placeholder="Auto-calculated or enter value"
                                value={formData.pdfDetails?.distressValue || ""}
                                onChange={(e) => handleValuationChange('distressValue', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-xs rounded-lg border border-teal-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 w-full"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-900">Sale Deed Value</Label>
                            <Input
                                type="number"
                                placeholder="Enter Sale Deed Value"
                                value={formData.pdfDetails?.saleDeedValue || ""}
                                onChange={(e) => handleValuationChange('saleDeedValue', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-xs rounded-lg border border-teal-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 w-full"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-900">Agreement Circle Rate</Label>
                            <Input
                                type="number"
                                placeholder="Enter Agreement Circle Rate"
                                value={formData.pdfDetails?.agreementCircleRate || ""}
                                onChange={(e) => handleValuationChange('agreementCircleRate', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-xs rounded-lg border border-teal-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 w-full"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-900">Agreement Value</Label>
                            <Input
                                type="number"
                                placeholder="Enter Agreement Value"
                                value={formData.pdfDetails?.agreementValue || ""}
                                onChange={(e) => handleValuationChange('agreementValue', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-xs rounded-lg border border-teal-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 w-full"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-900">Value as per Circle Rate</Label>
                            <Input
                                type="number"
                                placeholder="Enter Value as per Circle Rate"
                                value={formData.pdfDetails?.valueCircleRate || ""}
                                onChange={(e) => handleValuationChange('valueCircleRate', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-xs rounded-lg border border-teal-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 w-full"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-900">Insurable Value</Label>
                            <Input
                                type="number"
                                placeholder="Auto-calculated or enter value"
                                value={formData.pdfDetails?.insurableValue || ""}
                                onChange={(e) => handleValuationChange('insurableValue', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-xs rounded-lg border border-teal-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 w-full"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-900">Total Jantri Value</Label>
                            <Input
                                type="number"
                                placeholder="Enter Total Jantri Value"
                                value={formData.pdfDetails?.totalJantriValue || ""}
                                onChange={(e) => handleValuationChange('totalJantriValue', e.target.value)}
                                disabled={!canEdit}
                                className="h-9 text-xs rounded-lg border border-teal-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* APARTMENT NATURE & LOCATION */}
                <div className="mb-6 p-6 bg-green-50 rounded-2xl border border-green-100">
                    <h4 className="font-bold text-gray-900 mb-4">Apartment Nature & Location</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Nature of the Apartment</Label>
                            <select
                                value={formData.pdfDetails?.apartmentNature || ""}
                                onChange={(e) => handleValuationChange('apartmentNature', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                            >
                                <option value="">Select</option>
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Mixed">Mixed</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Location</Label>
                            <Input
                                placeholder="e.g., CIDCO"
                                value={formData.pdfDetails?.apartmentLocation || ""}
                                onChange={(e) => handleValuationChange('apartmentLocation', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">C.T.S. No.</Label>
                            <Input
                                placeholder="e.g., Plot number"
                                value={formData.pdfDetails?.apartmentCTSNo || ""}
                                onChange={(e) => handleValuationChange('apartmentCTSNo', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Sector No.</Label>
                            <Input
                                placeholder="e.g., 26"
                                value={formData.pdfDetails?.apartmentSectorNo || ""}
                                onChange={(e) => handleValuationChange('apartmentSectorNo', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Block No.</Label>
                            <Input
                                placeholder="e.g., A"
                                value={formData.pdfDetails?.apartmentBlockNo || ""}
                                onChange={(e) => handleValuationChange('apartmentBlockNo', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Ward No.</Label>
                            <Input
                                placeholder="e.g., --"
                                value={formData.pdfDetails?.apartmentWardNo || ""}
                                onChange={(e) => handleValuationChange('apartmentWardNo', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Village / Municipality / Corporation</Label>
                            <Input
                                placeholder="e.g., CIDCO"
                                value={formData.pdfDetails?.apartmentVillageMunicipalityCounty || ""}
                                onChange={(e) => handleValuationChange('apartmentVillageMunicipalityCounty', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Door No. / Street or Road</Label>
                            <Input
                                placeholder="e.g., Flat No. B-45/0:2"
                                value={formData.pdfDetails?.apartmentDoorNoStreetRoad || ""}
                                onChange={(e) => handleValuationChange('apartmentDoorNoStreetRoad', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Pin Code</Label>
                            <Input
                                placeholder="e.g., 400703"
                                value={formData.pdfDetails?.apartmentPinCode || ""}
                                onChange={(e) => handleValuationChange('apartmentPinCode', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                            />
                        </div>
                    </div>
                </div>

                {/* BUILDING & CONSTRUCTION DETAILS */}
                <div className="mb-6 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <h4 className="font-bold text-gray-900 mb-4">Building & Construction Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Description of the locality (Residential / Commercial / Mixed)</Label>
                            <select
                                value={formData.pdfDetails?.descriptionOfLocalityResidentialCommercialMixed || ""}
                                onChange={(e) => handleValuationChange('descriptionOfLocalityResidentialCommercialMixed', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                            >
                                <option value="">Select Type</option>
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Mixed">Mixed</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Year of Construction</Label>
                            <Input
                                placeholder="e.g., 1993"
                                value={formData.pdfDetails?.yearOfConstruction || ""}
                                onChange={(e) => handleValuationChange('yearOfConstruction', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Number of Floors</Label>
                            <Input
                                placeholder="e.g., 5"
                                value={formData.pdfDetails?.numberOfFloors || ""}
                                onChange={(e) => handleValuationChange('numberOfFloors', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Type of structure</Label>
                            <select
                                value={formData.pdfDetails?.typeOfStructure || ""}
                                onChange={(e) => handleValuationChange('typeOfStructure', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                            >
                                <option value="">Select Structure</option>
                                <option value="RCC Frame with Masonry">RCC Frame with Masonry</option>
                                <option value="Load bearing Masonry">Load bearing Masonry</option>
                                <option value="Steel Frame">Steel Frame</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Number of dwelling units in the building</Label>
                            <Input
                                placeholder="e.g., 10"
                                value={formData.pdfDetails?.numberOfDwellingUnitsInBuilding || ""}
                                onChange={(e) => handleValuationChange('numberOfDwellingUnitsInBuilding', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Quality of Construction</Label>
                            <select
                                value={formData.pdfDetails?.qualityOfConstruction || ""}
                                onChange={(e) => handleValuationChange('qualityOfConstruction', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                            >
                                <option value="">Select Quality</option>
                                <option value="Good">Good</option>
                                <option value="Average">Average</option>
                                <option value="Poor">Poor</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Appearance of the Building</Label>
                            <select
                                value={formData.pdfDetails?.appearanceOfBuilding || ""}
                                onChange={(e) => handleValuationChange('appearanceOfBuilding', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                            >
                                <option value="">Select Appearance</option>
                                <option value="Good">Good</option>
                                <option value="Average">Average</option>
                                <option value="Poor">Poor</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Maintenance of the Building</Label>
                            <select
                                value={formData.pdfDetails?.maintenanceOfBuilding || ""}
                                onChange={(e) => handleValuationChange('maintenanceOfBuilding', e.target.value)}
                                disabled={!canEdit}
                                className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                            >
                                <option value="">Select Maintenance</option>
                                <option value="Good">Good</option>
                                <option value="Average">Average</option>
                                <option value="Poor">Poor</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* FACILITIES AVAILABLE */}
                <div className="mb-6 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
                    <h4 className="font-bold text-gray-900 mb-4">Facilities Available</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Lift</Label>
                            <select value={formData.pdfDetails?.liftAvailable || ""} onChange={(e) => handleValuationChange('liftAvailable', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                                <option value="">Select</option>
                                <option value="Available">Available</option>
                                <option value="Not Available">Not Available</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Protected water supply</Label>
                            <select value={formData.pdfDetails?.protectedWaterSupply || ""} onChange={(e) => handleValuationChange('protectedWaterSupply', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                                <option value="">Select</option>
                                <option value="Available">Available</option>
                                <option value="Not Available">Not Available</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Underground Sewerage</Label>
                            <select value={formData.pdfDetails?.undergroundSewerage || ""} onChange={(e) => handleValuationChange('undergroundSewerage', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                                <option value="">Select</option>
                                <option value="Available">Available</option>
                                <option value="Not Available">Not Available</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Car parking (Open/Covered)</Label>
                            <select value={formData.pdfDetails?.carParkingOpenCovered || ""} onChange={(e) => handleValuationChange('carParkingOpenCovered', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                                <option value="">Select</option>
                                <option value="Open">Open</option>
                                <option value="Covered">Covered</option>
                                <option value="Not Available">Not Available</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Compound Wall</Label>
                            <select value={formData.pdfDetails?.isCompoundWallExisting || ""} onChange={(e) => handleValuationChange('isCompoundWallExisting', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Pavement around the building</Label>
                            <select value={formData.pdfDetails?.isPavementLaidAroundBuilding || ""} onChange={(e) => handleValuationChange('isPavementLaidAroundBuilding', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">Any others facility</Label>
                            <select value={formData.pdfDetails?.othersFacility || ""} onChange={(e) => handleValuationChange('othersFacility', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderMarketAnalysisTab = () => (
        <div className="space-y-6">
            {/* IV MARKETABILITY SECTION */}
            <div className="mb-6 p-6 bg-cyan-50 rounded-2xl border border-cyan-100">
                <h4 className="font-bold text-gray-900 mb-4 text-base">Marketability</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-900 block">Marketability</Label>
                        <Textarea
                            placeholder="e.g., Property is good..."
                            value={formData.pdfDetails?.marketability || ""}
                            onChange={(e) => handleValuationChange('marketability', e.target.value)}
                            disabled={!canEdit}
                            className="text-xs rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                            rows="2"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-900 block">Favoring Factors</Label>
                        <Textarea
                            placeholder="e.g., Amenities nearby..."
                            value={formData.pdfDetails?.favoringFactors || ""}
                            onChange={(e) => handleValuationChange('favoringFactors', e.target.value)}
                            disabled={!canEdit}
                            className="text-xs rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                            rows="2"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold text-gray-900 block">Negative Factors</Label>
                        <Textarea
                            placeholder="e.g., No negative factors"
                            value={formData.pdfDetails?.negativeFactors || ""}
                            onChange={(e) => handleValuationChange('negativeFactors', e.target.value)}
                            disabled={!canEdit}
                            className="text-xs rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                            rows="2"
                        />
                    </div>
                </div>
            </div>

            {/* RATE SECTION */}
            <div className="mb-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-gray-900 mb-4 text-base">Rate Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-900 block">Applicable Rate</Label>
                        <Textarea
                            placeholder="e.g., Rate per sq.ft..."
                            value={formData.pdfDetails?.marketabilityDescription || ""}
                            onChange={(e) => handleValuationChange('marketabilityDescription', e.target.value)}
                            disabled={!canEdit}
                            className="text-xs rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                            rows="2"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-900 block">Land Rate (New Const.)</Label>
                        <Textarea
                            placeholder="e.g., Land rate..."
                            value={formData.pdfDetails?.smallFlatDescription || ""}
                            onChange={(e) => handleValuationChange('smallFlatDescription', e.target.value)}
                            disabled={!canEdit}
                            className="text-xs rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                            rows="2"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold text-gray-900 block">Rate Adjustments</Label>
                        <Textarea
                            placeholder="e.g., Adjustments..."
                            value={formData.pdfDetails?.rateAdjustments || ""}
                            onChange={(e) => handleValuationChange('rateAdjustments', e.target.value)}
                            disabled={!canEdit}
                            className="text-xs rounded-lg border border-neutral-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                            rows="2"
                        />
                    </div>
                </div>
            </div>

            {/* BREAK-UP FOR THE RATE */}
            <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                <h4 className="font-bold text-gray-900 mb-4"> Break-up for the above Rate</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Building + Services </Label>
                        <Input
                            placeholder="e.g., ₹ 3,000/- per Sq. ft."
                            value={formData.pdfDetails?.buildingServicesRate || ""}
                            onChange={(e) => handleValuationChange('buildingServicesRate', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Land + Other </Label>
                        <Input
                            placeholder="e.g., ₹ 15,000/- per Sq. ft."
                            value={formData.pdfDetails?.landOthersRate || ""}
                            onChange={(e) => handleValuationChange('landOthersRate', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* COMPOSITE RATE AFTER DEPRECIATION */}
            <div className="mb-6 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                <h4 className="font-bold text-gray-900 mb-4">Composite Rate after depreciation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Depreciation Building Date</Label>
                        <Input
                            type="date"
                            value={formData.pdfDetails?.depreciationBuildingDate || ""}
                            onChange={(e) => handleValuationChange('depreciationBuildingDate', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Replacement Cost Services</Label>
                        <Input
                            placeholder="e.g., ₹ Value"
                            value={formData.pdfDetails?.replacementCostServices || ""}
                            onChange={(e) => handleValuationChange('replacementCostServices', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Age of the Building/Assumed</Label>
                        <Input
                            placeholder="e.g., 42 years"
                            value={formData.pdfDetails?.buildingAge || ""}
                            onChange={(e) => handleValuationChange('buildingAge', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Future Life of Building estimated</Label>
                        <Input
                            placeholder="e.g., 18 years"
                            value={formData.pdfDetails?.buildingLife || ""}
                            onChange={(e) => handleValuationChange('buildingLife', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Depreciation percentage</Label>
                        <Input
                            placeholder="e.g., 58 %"
                            value={formData.pdfDetails?.depreciationPercentage || ""}
                            onChange={(e) => handleValuationChange('depreciationPercentage', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Depreciation Rate of the building </Label>
                        <Input
                            placeholder="e.g., Value"
                            value={formData.pdfDetails?.depreciationStorage || ""}
                            onChange={(e) => handleValuationChange('depreciationStorage', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* TOTAL COMPOSITE RATE */}
            <div className="mb-6 p-6 bg-green-50 rounded-2xl border border-green-100">
                <h4 className="font-bold text-gray-900 mb-4">Total Composite Rate</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Total Composite Rate</Label>
                        <Input
                            placeholder="e.g., ₹ Value"
                            value={formData.pdfDetails?.totalCompositeRate || ""}
                            onChange={(e) => handleValuationChange('totalCompositeRate', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Depreciated Building Rate</Label>
                        <Input
                            placeholder="e.g., ₹ Value per Sq. ft."
                            value={formData.pdfDetails?.depreciatedBuildingRate || ""}
                            onChange={(e) => handleValuationChange('depreciatedBuildingRate', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Rate for Land & Other</Label>
                        <Input
                            placeholder="e.g., ₹ Value"
                            value={formData.pdfDetails?.rateForLandOther || ""}
                            onChange={(e) => handleValuationChange('rateForLandOther', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* FLAT/UNIT SPECIFICATIONS */}
            <div className="mb-6 p-6 bg-sky-50 rounded-2xl border border-sky-100">
                <h4 className="font-bold text-gray-900 mb-4">Unit Specifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">The floor in which the Unit is situated</Label>
                        <select
                            value={formData.pdfDetails?.unitFloor || ""}
                            onChange={(e) => handleValuationChange('unitFloor', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Floor</option>
                            <option value="Ground">Ground</option>
                            <option value="1st">1st</option>
                            <option value="2nd">2nd</option>
                            <option value="3rd">3rd</option>
                            <option value="Higher">Higher</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Door Number of the Flat</Label>
                        <Input
                            placeholder="e.g., Flat No. B-402"
                            value={formData.pdfDetails?.unitDoorNo || ""}
                            onChange={(e) => handleValuationChange('unitDoorNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Specifications - Roof</Label>
                        <Input
                            placeholder="e.g., RCC"
                            value={formData.pdfDetails?.unitRoof || ""}
                            onChange={(e) => handleValuationChange('unitRoof', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Specifications - Flooring</Label>
                        <Input
                            placeholder="e.g., Marble/Tiles"
                            value={formData.pdfDetails?.unitFlooring || ""}
                            onChange={(e) => handleValuationChange('unitFlooring', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Specifications - Doors & Windows</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.unitDoors || ""}
                            onChange={(e) => handleValuationChange('unitDoors', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Specifications - Bath & WC</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.unitBathAndWC || ""}
                            onChange={(e) => handleValuationChange('unitBathAndWC', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Specifications - Electrical Wiring</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.unitElectricalWiring || ""}
                            onChange={(e) => handleValuationChange('unitElectricalWiring', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Specification of the Flat</Label>
                        <Input
                            placeholder="e.g., 1RK, 2BHK, 3BHK"
                            value={formData.pdfDetails?.unitSpecification || ""}
                            onChange={(e) => handleValuationChange('unitSpecification', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Specifications - Fittings</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.unitFittings || ""}
                            onChange={(e) => handleValuationChange('unitFittings', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Specifications - Finishing</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.unitFinishing || ""}
                            onChange={(e) => handleValuationChange('unitFinishing', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
            </div>

            {/* ELECTRICITY SERVICE */}
            <div className="mb-6 p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                <h4 className="font-bold text-gray-900 mb-4">Electricity Service Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Electricity service connection number Meter
                            card is in the name of </Label>
                        <Input
                            placeholder="e.g., Service Number"
                            value={formData.pdfDetails?.electricityServiceNo || ""}
                            onChange={(e) => handleValuationChange('electricityServiceNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                </div>
            </div>

            {/* UNIT TAX/ASSESSMENT */}
            <div className="mb-6 p-6 bg-lime-50 rounded-2xl border border-lime-100">
                <h4 className="font-bold text-gray-900 mb-4">Unit Tax & Assessment</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Assessment No.</Label>
                        <Input
                            placeholder="e.g., Assessment No."
                            value={formData.pdfDetails?.assessmentNo || ""}
                            onChange={(e) => handleValuationChange('assessmentNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Tax Paid Name</Label>
                        <Input
                            placeholder="e.g., Name"
                            value={formData.pdfDetails?.taxPaidName || ""}
                            onChange={(e) => handleValuationChange('taxPaidName', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Tax Amount</Label>
                        <Input
                            placeholder="e.g., Amount"
                            value={formData.pdfDetails?.taxAmount || ""}
                            onChange={(e) => handleValuationChange('taxAmount', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* AGREEMENT FOR SALE */}
            <div className="mb-6 p-6 bg-pink-50 rounded-2xl border border-pink-100">
                <h4 className="font-bold text-gray-900 mb-4">Agreement for Sale</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Agreement for Sale executed Name</Label>
                        <Input
                            placeholder="e.g., Agreement Name/Details"
                            value={formData.pdfDetails?.agreementSaleExecutedName || ""}
                            onChange={(e) => handleValuationChange('agreementSaleExecutedName', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* UNIT AREA DETAILS */}
            <div className="mb-6 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                <h4 className="font-bold text-gray-900 mb-4">Area Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">What is the undivided area of the land as per
                            sale deed ? </Label>
                        <Input
                            placeholder="e.g., Area in Sq. ft."
                            value={formData.pdfDetails?.undividedAreaLand || ""}
                            onChange={(e) => handleValuationChange('undividedAreaLand', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Plinth Area of Flat </Label>
                        <Input
                            placeholder="e.g., 278.57 Sq ft"
                            value={formData.pdfDetails?.plinthArea || ""}
                            onChange={(e) => handleValuationChange('plinthArea', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Carpet Area of Flat</Label>
                        <Input
                            placeholder="e.g., Area in Sq. ft."
                            value={formData.pdfDetails?.carpetArea || ""}
                            onChange={(e) => handleValuationChange('carpetArea', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">What is the floor space index?</Label>
                        <Input
                            placeholder="e.g., FSI value"
                            value={formData.pdfDetails?.floorSpaceIndex || ""}
                            onChange={(e) => handleValuationChange('floorSpaceIndex', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* UNIT MAINTENANCE */}
            <div className="mb-6 p-6 bg-fuchsia-50 rounded-2xl border border-fuchsia-100">
                <h4 className="font-bold text-gray-900 mb-4">Unit Maintenance</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">How is the maintenance of the Flat ?</Label>
                        <select
                            value={formData.pdfDetails?.unitMaintenance || ""}
                            onChange={(e) => handleValuationChange('unitMaintenance', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3"
                        >
                            <option value="">Select</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* UNIT CLASSIFICATION */}
            <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                <h4 className="font-bold text-gray-900 mb-4">Unit Classification</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Classification - Posh</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.classificationPosh || ""}
                            onChange={(e) => handleValuationChange('classificationPosh', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Classification - Usage</Label>
                        <Input
                            placeholder="e.g., Residential/Commercial"
                            value={formData.pdfDetails?.classificationUsage || ""}
                            onChange={(e) => handleValuationChange('classificationUsage', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Is it owner occupied or tenanted?</Label>
                        <select
                            value={formData.pdfDetails?.ownerOccupancyStatus || ""}
                            onChange={(e) => handleValuationChange('ownerOccupancyStatus', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3"
                        >
                            <option value="">Select</option>
                            <option value="Owner Occupied">Owner Occupied</option>
                            <option value="Tenanted">Tenanted</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">If tenanted, what is the monthly rent?</Label>
                        <Input
                            placeholder="e.g., Amount"
                            value={formData.pdfDetails?.monthlyRent || ""}
                            onChange={(e) => handleValuationChange('monthlyRent', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBuildingTab = () => (
        <div className="space-y-6">
            {/* APARTMENT NATURE & LOCATION */}
            <div className="mb-6 p-6 bg-green-50 rounded-2xl border border-green-100">
                <h4 className="font-bold text-gray-900 mb-4">Apartment Nature & Location</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Nature of the Apartment</Label>
                        <select
                            value={formData.pdfDetails?.apartmentNature || ""}
                            onChange={(e) => handleValuationChange('apartmentNature', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select</option>
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Mixed">Mixed</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Location</Label>
                        <Input
                            placeholder="e.g., CIDCO"
                            value={formData.pdfDetails?.apartmentLocation || ""}
                            onChange={(e) => handleValuationChange('apartmentLocation', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">C.T.S. No.</Label>
                        <Input
                            placeholder="e.g., Plot number"
                            value={formData.pdfDetails?.apartmentCTSNo || ""}
                            onChange={(e) => handleValuationChange('apartmentCTSNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Sector No.</Label>
                        <Input
                            placeholder="e.g., 26"
                            value={formData.pdfDetails?.apartmentSectorNo || ""}
                            onChange={(e) => handleValuationChange('apartmentSectorNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Block No.</Label>
                        <Input
                            placeholder="e.g., A"
                            value={formData.pdfDetails?.apartmentBlockNo || ""}
                            onChange={(e) => handleValuationChange('apartmentBlockNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Ward No.</Label>
                        <Input
                            placeholder="e.g., --"
                            value={formData.pdfDetails?.apartmentWardNo || ""}
                            onChange={(e) => handleValuationChange('apartmentWardNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Village / Municipality / Corporation</Label>
                        <Input
                            placeholder="e.g., CIDCO"
                            value={formData.pdfDetails?.apartmentVillageMunicipalityCounty || ""}
                            onChange={(e) => handleValuationChange('apartmentVillageMunicipalityCounty', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Door No. / Street or Road</Label>
                        <Input
                            placeholder="e.g., Flat No. B-45/0:2"
                            value={formData.pdfDetails?.apartmentDoorNoStreetRoad || ""}
                            onChange={(e) => handleValuationChange('apartmentDoorNoStreetRoad', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Pin Code</Label>
                        <Input
                            placeholder="e.g., 400703"
                            value={formData.pdfDetails?.apartmentPinCode || ""}
                            onChange={(e) => handleValuationChange('apartmentPinCode', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
            </div>

            {/* BUILDING & CONSTRUCTION DETAILS */}
            <div className="mb-6 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <h4 className="font-bold text-gray-900 mb-4">Building & Construction Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Description of the locality (Residential / Commercial / Mixed)</Label>
                        <select
                            value={formData.pdfDetails?.descriptionOfLocalityResidentialCommercialMixed || ""}
                            onChange={(e) => handleValuationChange('descriptionOfLocalityResidentialCommercialMixed', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Type</option>
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Mixed">Mixed</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Year of Construction</Label>
                        <Input
                            placeholder="e.g., 1993"
                            value={formData.pdfDetails?.yearOfConstruction || ""}
                            onChange={(e) => handleValuationChange('yearOfConstruction', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Number of Floors</Label>
                        <Input
                            placeholder="e.g., 5"
                            value={formData.pdfDetails?.numberOfFloors || ""}
                            onChange={(e) => handleValuationChange('numberOfFloors', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Type of structure</Label>
                        <select
                            value={formData.pdfDetails?.typeOfStructure || ""}
                            onChange={(e) => handleValuationChange('typeOfStructure', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Structure</option>
                            <option value="RCC Frame with Masonry">RCC Frame with Masonry</option>
                            <option value="Load bearing Masonry">Load bearing Masonry</option>
                            <option value="Steel Frame">Steel Frame</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Number of dwelling units in the building</Label>
                        <Input
                            placeholder="e.g., 10"
                            value={formData.pdfDetails?.numberOfDwellingUnitsInBuilding || ""}
                            onChange={(e) => handleValuationChange('numberOfDwellingUnitsInBuilding', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Quality of Construction</Label>
                        <select
                            value={formData.pdfDetails?.qualityOfConstruction || ""}
                            onChange={(e) => handleValuationChange('qualityOfConstruction', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Quality</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Appearance of the Building</Label>
                        <select
                            value={formData.pdfDetails?.appearanceOfBuilding || ""}
                            onChange={(e) => handleValuationChange('appearanceOfBuilding', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Appearance</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Maintenance of the Building</Label>
                        <select
                            value={formData.pdfDetails?.maintenanceOfBuilding || ""}
                            onChange={(e) => handleValuationChange('maintenanceOfBuilding', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Maintenance</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* FACILITIES AVAILABLE */}
            <div className="mb-6 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="font-bold text-gray-900 mb-4">Facilities Available</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Lift</Label>
                        <select value={formData.pdfDetails?.liftAvailable || ""} onChange={(e) => handleValuationChange('liftAvailable', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                            <option value="">Select</option>
                            <option value="Available">Available</option>
                            <option value="Not Available">Not Available</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Protected water supply</Label>
                        <select value={formData.pdfDetails?.protectedWaterSupply || ""} onChange={(e) => handleValuationChange('protectedWaterSupply', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                            <option value="">Select</option>
                            <option value="Available">Available</option>
                            <option value="Not Available">Not Available</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Underground Sewerage</Label>
                        <select value={formData.pdfDetails?.undergroundSewerage || ""} onChange={(e) => handleValuationChange('undergroundSewerage', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                            <option value="">Select</option>
                            <option value="Available">Available</option>
                            <option value="Not Available">Not Available</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Car parking (Open/Covered)</Label>
                        <select value={formData.pdfDetails?.carParkingOpenCovered || ""} onChange={(e) => handleValuationChange('carParkingOpenCovered', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                            <option value="">Select</option>
                            <option value="Open">Open</option>
                            <option value="Covered">Covered</option>
                            <option value="Not Available">Not Available</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Compound Wall</Label>
                        <select value={formData.pdfDetails?.isCompoundWallExisting || ""} onChange={(e) => handleValuationChange('isCompoundWallExisting', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Pavement around the building</Label>
                        <select value={formData.pdfDetails?.isPavementLaidAroundBuilding || ""} onChange={(e) => handleValuationChange('isPavementLaidAroundBuilding', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Any others facility</Label>
                        <select value={formData.pdfDetails?.othersFacility || ""} onChange={(e) => handleValuationChange('othersFacility', e.target.value)} disabled={!canEdit} className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3">
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPropertyTab = () => (
        <div className="space-y-6">
            {/* PROPERTY LOCATION & DESCRIPTION */}
            <div className="mb-6 p-6 bg-cyan-50 rounded-2xl border border-cyan-100">
                <h4 className="font-bold text-gray-900 mb-4">Location of the property</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">a) Plot No./ Survey No.</Label>
                        <Input
                            placeholder="e.g., S. No. 26"
                            value={formData.pdfDetails?.plotSurveyNo || ""}
                            onChange={(e) => handleValuationChange('plotSurveyNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">b) Door No.</Label>
                        <Input
                            placeholder="e.g., Hali No. B-4502"
                            value={formData.pdfDetails?.doorNo || ""}
                            onChange={(e) => handleValuationChange('doorNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">c) T.S. No./Village</Label>
                        <Input
                            placeholder="e.g., Yasai"
                            value={formData.pdfDetails?.tpVillage || ""}
                            onChange={(e) => handleValuationChange('tpVillage', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">d) Ward/Taluka</Label>
                        <Input
                            placeholder="e.g., Taluka"
                            value={formData.pdfDetails?.wardTaluka || ""}
                            onChange={(e) => handleValuationChange('wardTaluka', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">e) District</Label>
                        <Input
                            placeholder="e.g., District"
                            value={formData.pdfDetails?.mandalDistrict || ""}
                            onChange={(e) => handleValuationChange('mandalDistrict', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">f) Date of issue and validity of layout plan</Label>
                        <Input
                            type="date"
                            value={formData.pdfDetails?.layoutPlanIssueDate || ""}
                            onChange={(e) => handleValuationChange('layoutPlanIssueDate', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">g) Approved map/plan issuing authority </Label>
                        <Input
                            placeholder="e.g., CIDCO"
                            value={formData.pdfDetails?.approvedMapAuthority || ""}
                            onChange={(e) => handleValuationChange('approvedMapAuthority', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">h) Whether authenticity of approved map/plan is verified</Label>
                        <select
                            value={formData.pdfDetails?.authenticityVerified || ""}
                            onChange={(e) => handleValuationChange('authenticityVerified', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Status</option>
                            <option value="Verified">Yes</option>
                            <option value="Not Verified">Not</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">i) Any other conveniences provided by our approved plan</Label>
                        <Textarea
                            placeholder="e.g., Parking, Amenities, etc."
                            value={formData.pdfDetails?.otherApprovedPlanDetails || ""}
                            onChange={(e) => handleValuationChange('otherApprovedPlanDetails', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300"
                            rows="2"
                        />
                    </div>


                </div>
            </div>

            {/* POSTAL ADDRESS & CLASSIFICATION */}
            <div className="mb-6 p-6 bg-violet-50 rounded-2xl border border-violet-100">
                <h4 className="font-bold text-gray-900 mb-4">Property Classification & Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Postal Address of the property</Label>
                        <Textarea
                            placeholder="Enter full address"
                            value={formData.pdfDetails?.postalAddress || ""}
                            onChange={(e) => handleValuationChange('postalAddress', e.target.value)}
                            disabled={!canEdit}
                            className="text-sm rounded-lg border border-neutral-300"
                            rows="3"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">City/Town</Label>
                        <Input
                            placeholder="e.g., Mumbai"
                            value={formData.pdfDetails?.cityTown || ""}
                            onChange={(e) => handleValuationChange('cityTown', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
                <div className="mt-4 space-y-3">
                    <Label className="text-sm font-bold text-gray-900">Area Type</Label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.pdfDetails?.residentialArea || false}
                                onChange={(e) => handleValuationChange('residentialArea', e.target.checked)}
                                disabled={!canEdit}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">Residential Area</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.pdfDetails?.commercialArea || false}
                                onChange={(e) => handleValuationChange('commercialArea', e.target.checked)}
                                disabled={!canEdit}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">Commercial Area</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.pdfDetails?.industrialArea || false}
                                onChange={(e) => handleValuationChange('industrialArea', e.target.checked)}
                                disabled={!canEdit}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">Industrial Area</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* BOUNDARIES OF PROPERTY */}
            <div className="mb-6 p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-4">Boundaries of Property</h4>
                <div className="space-y-6">
                    {/* Plot Boundaries Table */}
                    <div>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-indigo-100">
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">a</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">Boundaries of the property - Plot</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">As per Deed</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">As per Actual</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">North</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotNorthDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotNorthDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotNorthActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotNorthActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">South</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotSouthDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotSouthDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotSouthActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotSouthActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">East</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotEastDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotEastDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotEastActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotEastActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">West</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotWestDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotWestDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesPlotWestActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesPlotWestActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Flat/Shop Boundaries Table */}
                    <div>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-indigo-100">
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">b</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">Boundaries of the property - Flat</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">As per Deed</th>
                                    <th className="border border-gray-300 p-3 text-left font-bold text-gray-900 w-1/4">As per Actual</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">North</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopNorthDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopNorthDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopNorthActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopNorthActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">South</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopSouthDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopSouthDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopSouthActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopSouthActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">East</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopEastDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopEastDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopEastActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopEastActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="1" className="border border-gray-300 p-3"></td>
                                    <td className="border border-gray-300 p-3 font-semibold text-gray-800">West</td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopWestDeed || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopWestDeed', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <Input
                                            placeholder="NA"
                                            value={formData.pdfDetails?.boundariesShopWestActual || ""}
                                            onChange={(e) => handleValuationChange('boundariesShopWestActual', e.target.value)}
                                            disabled={!canEdit}
                                            className="h-9 text-sm rounded-lg border border-neutral-300"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* DIMENSIONS OF THE PROPERTY */}
            <div className="mb-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-gray-900 mb-4">Dimensions of the Unit</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Dimensions (as per Document)</Label>
                        <Input
                            placeholder="e.g., 28.88 Sq. ft. / 2.88 Sq. ft."
                            value={formData.pdfDetails?.dimensionsDeed || ""}
                            onChange={(e) => handleValuationChange('dimensionsDeed', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Dimensions (as per Actuals)</Label>
                        <Input
                            placeholder="e.g., 28.88 Sq. ft. / 2.88 Sq. ft."
                            value={formData.pdfDetails?.dimensionsActual || ""}
                            onChange={(e) => handleValuationChange('dimensionsActual', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
            </div>

            {/* EXTENT OF THE UNIT */}
            <div className="mb-6 p-6 bg-green-50 rounded-2xl border border-green-100">
                <h4 className="font-bold text-gray-900 mb-4">Extent of the site</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Extent of Site</Label>
                        <Input
                            placeholder="e.g., ₹ 40,34,950 per Sq. ft."
                            value={formData.pdfDetails?.extentOfUnit || ""}
                            onChange={(e) => handleValuationChange('extentOfUnit', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Latitude/Longitude</Label>
                        <Input
                            placeholder="e.g., 19°07'53.2 N & 73°00"
                            value={formData.pdfDetails?.latitudeLongitude || ""}
                            onChange={(e) => handleValuationChange('latitudeLongitude', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>

                </div>
            </div>

            {/* EXTENT OF SITE & RENT */}
            <div className="mb-6 p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                <h4 className="font-bold text-gray-900 mb-4">Extent & Occupancy Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Extent of Site Considered for Valuation</Label>
                        <Input
                            placeholder="e.g., Area in Sq. ft."
                            value={formData.pdfDetails?.extentOfSiteValuation || ""}
                            onChange={(e) => handleValuationChange('extentOfSiteValuation', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Whether occupied by the owner/tenant? If occupied by tenant, since how long? Rent
                            received per month </Label>
                        <Input
                            placeholder="Owner/ Tenant & Rent Amount"
                            value={formData.pdfDetails?.rentReceivedPerMonth || ""}
                            onChange={(e) => handleValuationChange('rentReceivedPerMonth', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
            </div>

            {/* AREA CLASSIFICATION */}
            <div className="mb-6 p-6 bg-teal-50 rounded-2xl border border-teal-100">
                <h4 className="font-bold text-gray-900 mb-4">Area Classification</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">High/Middle/Poor</Label>
                        <select
                            value={formData.pdfDetails?.areaClassification || ""}
                            onChange={(e) => handleValuationChange('areaClassification', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select</option>
                            <option value="High">High</option>
                            <option value="Middle">Middle</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Metro / Urban / Semi-Urban / Rural</Label>
                        <select
                            value={formData.pdfDetails?.urbanClassification || ""}
                            onChange={(e) => handleValuationChange('urbanClassification', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select</option>
                            <option value="Metro">Metro</option>
                            <option value="Urban">Urban</option>
                            <option value="Semi-Urban">Semi-Urban</option>
                            <option value="Rural">Rural</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Government Type / Comming Under</Label>
                        <select
                            value={formData.pdfDetails?.governmentType || ""}
                            onChange={(e) => handleValuationChange('governmentType', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Type</option>
                            <option value="Municipal">Municipality</option>
                            <option value="Corporation">Corporation</option>
                            <option value="Government">Government</option>
                            <option value="Village Panchayat">Village Panchayat</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Whether covered under any Govt. Enactments</Label>
                        <select
                            value={formData.pdfDetails?.govtEnactmentsCovered || ""}
                            onChange={(e) => handleValuationChange('govtEnactmentsCovered', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFlatTab = () => (
        <div className="space-y-6">
            {/* FLAT/UNIT SPECIFICATIONS */}
            <div className="mb-6 p-6 bg-sky-50 rounded-2xl border border-sky-100">
                <h4 className="font-bold text-gray-900 mb-4">Unit Specifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">The floor in which the Unit is situated</Label>
                        <select
                            value={formData.pdfDetails?.unitFloor || ""}
                            onChange={(e) => handleValuationChange('unitFloor', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white px-3"
                        >
                            <option value="">Select Floor</option>
                            <option value="Ground">Ground</option>
                            <option value="1st">1st</option>
                            <option value="2nd">2nd</option>
                            <option value="3rd">3rd</option>
                            <option value="Higher">Higher</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Door Number of the Flat</Label>
                        <Input
                            placeholder="e.g., Flat No. B-402"
                            value={formData.pdfDetails?.unitDoorNo || ""}
                            onChange={(e) => handleValuationChange('unitDoorNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Specifications - Roof</Label>
                        <Input
                            placeholder="e.g., RCC"
                            value={formData.pdfDetails?.unitRoof || ""}
                            onChange={(e) => handleValuationChange('unitRoof', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Specifications - Flooring</Label>
                        <Input
                            placeholder="e.g., Marble/Tiles"
                            value={formData.pdfDetails?.unitFlooring || ""}
                            onChange={(e) => handleValuationChange('unitFlooring', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Specifications - Doors & Windows</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.unitDoors || ""}
                            onChange={(e) => handleValuationChange('unitDoors', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Specifications - Bath & WC</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.unitBathAndWC || ""}
                            onChange={(e) => handleValuationChange('unitBathAndWC', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Specifications - Electrical Wiring</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.unitElectricalWiring || ""}
                            onChange={(e) => handleValuationChange('unitElectricalWiring', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Specification of the Flat</Label>
                        <Input
                            placeholder="e.g., 1RK, 2BHK, 3BHK"
                            value={formData.pdfDetails?.unitSpecification || ""}
                            onChange={(e) => handleValuationChange('unitSpecification', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Specifications - Fittings</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.unitFittings || ""}
                            onChange={(e) => handleValuationChange('unitFittings', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Specifications - Finishing</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.unitFinishing || ""}
                            onChange={(e) => handleValuationChange('unitFinishing', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2"
                        />
                    </div>
                </div>
            </div>

            {/* ELECTRICITY SERVICE */}
            <div className="mb-6 p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                <h4 className="font-bold text-gray-900 mb-4">Electricity Service Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Electricity service connection number</Label>
                        <Input
                            placeholder="e.g., Service Number"
                            value={formData.pdfDetails?.electricityServiceNo || ""}
                            onChange={(e) => handleValuationChange('electricityServiceNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Meter card is in the name of</Label>
                        <Input
                            placeholder="e.g., Name"
                            value={formData.pdfDetails?.meterCardName || ""}
                            onChange={(e) => handleValuationChange('meterCardName', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                </div>
            </div>

            {/* UNIT TAX/ASSESSMENT */}
            <div className="mb-6 p-6 bg-lime-50 rounded-2xl border border-lime-100">
                <h4 className="font-bold text-gray-900 mb-4">Unit Tax & Assessment</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Assessment No.</Label>
                        <Input
                            placeholder="e.g., Assessment No."
                            value={formData.pdfDetails?.assessmentNo || ""}
                            onChange={(e) => handleValuationChange('assessmentNo', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Tax Paid Name</Label>
                        <Input
                            placeholder="e.g., Name"
                            value={formData.pdfDetails?.taxPaidName || ""}
                            onChange={(e) => handleValuationChange('taxPaidName', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Tax Amount</Label>
                        <Input
                            placeholder="e.g., Amount"
                            value={formData.pdfDetails?.taxAmount || ""}
                            onChange={(e) => handleValuationChange('taxAmount', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* AGREEMENT FOR SALE */}
            <div className="mb-6 p-6 bg-pink-50 rounded-2xl border border-pink-100">
                <h4 className="font-bold text-gray-900 mb-4">Agreement for Sale</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Agreement for Sale executed Name</Label>
                        <Input
                            placeholder="e.g., Agreement Name/Details"
                            value={formData.pdfDetails?.agreementSaleExecutedName || ""}
                            onChange={(e) => handleValuationChange('agreementSaleExecutedName', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* UNIT AREA DETAILS */}
            <div className="mb-6 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                <h4 className="font-bold text-gray-900 mb-4">Area Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">What is the undivided area of the land as per
                            sale deed ? </Label>
                        <Input
                            placeholder="e.g., Area in Sq. ft."
                            value={formData.pdfDetails?.undividedAreaLand || ""}
                            onChange={(e) => handleValuationChange('undividedAreaLand', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Plinth Area of Flat </Label>
                        <Input
                            placeholder="e.g., 278.57 Sq ft"
                            value={formData.pdfDetails?.plinthArea || ""}
                            onChange={(e) => handleValuationChange('plinthArea', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Carpet Area of Flat</Label>
                        <Input
                            placeholder="e.g., Area in Sq. ft."
                            value={formData.pdfDetails?.carpetArea || ""}
                            onChange={(e) => handleValuationChange('carpetArea', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">What is the floor space index?</Label>
                        <Input
                            placeholder="e.g., FSI value"
                            value={formData.pdfDetails?.floorSpaceIndex || ""}
                            onChange={(e) => handleValuationChange('floorSpaceIndex', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>

            {/* UNIT MAINTENANCE */}
            <div className="mb-6 p-6 bg-fuchsia-50 rounded-2xl border border-fuchsia-100">
                <h4 className="font-bold text-gray-900 mb-4">Unit Maintenance</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">How is the maintenance of the Flat ?</Label>
                        <select
                            value={formData.pdfDetails?.unitMaintenance || ""}
                            onChange={(e) => handleValuationChange('unitMaintenance', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3"
                        >
                            <option value="">Select</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* UNIT CLASSIFICATION */}
            <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                <h4 className="font-bold text-gray-900 mb-4">Unit Classification</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Classification - Posh</Label>
                        <Input
                            placeholder="e.g., Details"
                            value={formData.pdfDetails?.classificationPosh || ""}
                            onChange={(e) => handleValuationChange('classificationPosh', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-900">Classification - Usage</Label>
                        <Input
                            placeholder="e.g., Residential/Commercial"
                            value={formData.pdfDetails?.classificationUsage || ""}
                            onChange={(e) => handleValuationChange('classificationUsage', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">Is it owner occupied or tenanted?</Label>
                        <select
                            value={formData.pdfDetails?.ownerOccupancyStatus || ""}
                            onChange={(e) => handleValuationChange('ownerOccupancyStatus', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3"
                        >
                            <option value="">Select</option>
                            <option value="Owner Occupied">Owner Occupied</option>
                            <option value="Tenanted">Tenanted</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-900">If tenanted, what is the monthly rent?</Label>
                        <Input
                            placeholder="e.g., Amount"
                            value={formData.pdfDetails?.monthlyRent || ""}
                            onChange={(e) => handleValuationChange('monthlyRent', e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-xs rounded-lg border border-neutral-300 py-1 px-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    if (!valuation) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-80">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-muted-foreground">Loading valuation...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-4">
            {!isLoggedIn && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 max-w-sm border border-neutral-200 shadow-lg">
                        <p className="text-center font-semibold text-base text-neutral-900">Please login to edit this valuation</p>
                        <p className="text-center text-sm text-neutral-600 mt-3">You are currently viewing in read-only mode</p>
                    </div>
                </div>
            )}

            <div className="max-w-full mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                            navigate("/dashboard");
                        }}
                        className="h-9 w-9 border border-neutral-300 hover:bg-neutral-100 hover:border-blue-400 rounded-lg p-0 transition-colors"
                    >
                        <FaArrowLeft className="h-4 w-4 text-neutral-700" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">UBI APF Form</h1>
                        <p className="text-xs text-neutral-500 mt-1">{!isLoggedIn && "Read-Only Mode"}</p>
                    </div>
                </div>

                {/* Main Content - 2-Column Layout */}
                <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
                    {/* Left Column - Form Info */}
                    <div className="col-span-12 sm:col-span-3 lg:col-span-2">
                        <Card className="border border-neutral-200 bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-neutral-900">
                                    <FaFileAlt className="h-4 w-4 text-blue-500" />
                                    Form Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3 overflow-y-auto flex-1">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">By</p>
                                    <p className="text-sm font-medium text-neutral-900">{username}</p>
                                </div>
                                <div className="border-t border-neutral-200"></div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</p>
                                    <p className="text-sm font-medium text-neutral-900">{valuation?.status?.charAt(0).toUpperCase() + valuation?.status?.slice(1)}</p>
                                </div>
                                <div className="border-t border-neutral-200"></div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Last Updated</p>
                                    <p className="text-sm font-medium text-neutral-900 break-words">{new Date().toLocaleString()}</p>
                                </div>
                                <div className="border-t border-neutral-200"></div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">ID</p>
                                    <code className="bg-neutral-100 px-2 py-1.5 rounded-lg text-xs font-mono break-all text-neutral-700 border border-neutral-300 block">{id.slice(0, 12)}...</code>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Main Form */}
                    <div className="col-span-12 sm:col-span-9 lg:col-span-10">
                        <Card className="border border-neutral-200 bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="bg-neutral-50 text-neutral-900 p-4 border-b border-neutral-200">
                                <CardTitle className="text-sm font-bold text-neutral-900">UBI APF Form Details</CardTitle>
                                <p className="text-neutral-600 text-xs mt-1.5 font-medium">* Required fields</p>
                            </CardHeader>
                            <CardContent className="p-4 overflow-y-auto flex-1">
                                <form className="space-y-3" onSubmit={onFinish}>

                                    {/* Main Tab Navigation - Client/Documents/Valuation */}
                                    <div className="flex gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-6 overflow-x-auto">
                                        {[
                                            { id: 'client', label: 'CLIENT', icon: FaUser },
                                            { id: 'documents', label: 'DOCS', icon: FaFileAlt },
                                            { id: 'valuation', label: 'VALUATION', icon: FaBuilding }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`px-3 py-2 rounded-lg font-semibold text-xs whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${activeTab === tab.id
                                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                                    : "bg-white border border-gray-300 text-gray-900 hover:border-blue-500"
                                                    }`}
                                            >
                                                <tab.icon size={12} />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Client Info Tab */}
                                    {activeTab === 'client' && (
                                        <div>
                                            <ClientInfoPanel
                                                formData={formData}
                                                bankName={bankName}
                                                city={city}
                                                canEdit={canEdit}
                                                canEditField={canEditField}
                                                handleInputChange={handleInputChange}
                                                handleIntegerInputChange={handleIntegerInputChange}
                                                handleLettersOnlyInputChange={handleLettersOnlyInputChange}
                                                setBankName={setBankName}
                                                setCity={setCity}
                                                setFormData={setFormData}
                                                banks={banks}
                                                cities={cities}
                                                dsaNames={dsaNames}
                                                dsa={dsa}
                                                setDsa={setDsa}
                                            />
                                        </div>
                                    )}

                                    {/* Documents Tab */}
                                    {activeTab === 'documents' && (
                                        <div>
                                            <DocumentsPanel
                                                formData={formData}
                                                canEdit={canEdit}
                                                locationImagePreviews={locationImagePreviews}
                                                imagePreviews={imagePreviews}
                                                documentPreviews={formData.documentPreviews || []}
                                                handleLocationImageUpload={handleLocationImageUpload}
                                                handleImageUpload={handleImageUpload}
                                                handleDocumentUpload={handleDocumentUpload}
                                                removeLocationImage={removeLocationImage}
                                                removeImage={removeImage}
                                                removeDocument={removeDocument}
                                                handleInputChange={handleInputChange}
                                                handleCoordinateChange={handleCoordinateChange}
                                                setFormData={setFormData}
                                                locationFileInputRef={locationFileInputRef}
                                                fileInputRef1={fileInputRef1}
                                                fileInputRef2={fileInputRef2}
                                                fileInputRef3={fileInputRef3}
                                                fileInputRef4={fileInputRef4}
                                                documentFileInputRef={documentFileInputRef}
                                            />
                                        </div>
                                    )}

                                    {/* Valuation Tab */}
                                    {activeTab === 'valuation' && (
                                        <div>
                                            {/* Sub-tab Navigation */}
                                            <div className="flex gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-6 overflow-x-auto">
                                                {[
                                                    { id: 'general', label: 'GENERAL' },
                                                    { id: 'valuation', label: 'VALUATION' },
                                                    { id: 'market', label: 'MARKET' }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setActiveValuationSubTab(tab.id)}
                                                        className={`px-3 py-2 rounded-lg font-semibold text-xs whitespace-nowrap flex-shrink-0 transition-all ${activeValuationSubTab === tab.id
                                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                                            : "bg-white border border-gray-300 text-gray-900 hover:border-blue-500"
                                                            }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Sub-tab Content */}
                                            <div className="space-y-6">
                                                {activeValuationSubTab === 'general' && renderGeneralTab()}
                                                {activeValuationSubTab === 'valuation' && renderValuationTab()}
                                                {activeValuationSubTab === 'market' && renderMarketAnalysisTab()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Buttons */}
                                    <div className="flex gap-2 pt-3 border-t border-neutral-200">
                                        <Button
                                            type="button"
                                            onClick={handleDownloadPDF}
                                            disabled={loading}
                                            className="flex-1 h-9 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-1.5 whitespace-nowrap"
                                        >
                                            <FaDownload size={12} />
                                            PDF
                                        </Button>
                                        {canEdit && (
                                            <>
                                                <Button
                                                    type="button"
                                                    onClick={onFinish}
                                                    disabled={loading}
                                                    className="flex-1 h-9 text-xs font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 whitespace-nowrap"
                                                >
                                                    {loading ? "Saving..." : "Save"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        if (valuation) {
                                                            navigateToEditForm(valuation);
                                                        } else {
                                                            navigate("/dashboard");
                                                        }
                                                    }}
                                                    disabled={loading}
                                                    className="flex-1 h-9 text-xs font-bold rounded-lg border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-900 transition-all whitespace-nowrap"
                                                >
                                                    Back
                                                </Button>
                                            </>
                                        )}

                                        {canApprove && (
                                            <>
                                                <Button
                                                    type="button"
                                                    onClick={() => handleManagerAction("approve")}
                                                    disabled={loading}
                                                    className="flex-1 h-9 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 whitespace-nowrap"
                                                >
                                                    {loading ? "Processing..." : "Approve"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => handleManagerAction("reject")}
                                                    disabled={loading}
                                                    className="flex-1 h-9 text-xs font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60 whitespace-nowrap"
                                                >
                                                    {loading ? "Processing..." : "Reject"}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Approval/Rejection Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {modalAction === "approve" ? "Approve Form" : "Reject Form"}
                        </DialogTitle>
                        <DialogDescription>
                            {modalAction === "approve" ? "Enter approval notes (optional)" : "Please provide feedback for rejection"}
                        </DialogDescription>
                    </DialogHeader>

                    <Textarea
                        placeholder={modalAction === "approve" ? "Enter approval notes (optional)" : "Please provide feedback for rejection"}
                        value={modalFeedback}
                        onChange={(e) => setModalFeedback(e.target.value)}
                        rows={4}
                        autoFocus
                    />

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant={modalAction === "approve" ? "default" : "destructive"}
                            onClick={handleModalOk}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : (modalAction === "approve" ? "Approve" : "Reject")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UbiApfEditForm;
