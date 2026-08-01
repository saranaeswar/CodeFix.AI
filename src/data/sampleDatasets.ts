import { SoftwareModuleRow } from "../types";

export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  fileName: string;
  modules: SoftwareModuleRow[];
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "nasa-jm1",
    name: "NASA Promise Benchmark (JM1)",
    description: "Real-world C++ flight software modules dataset from NASA metrics repository (LOC, Cyclomatic Complexity, Halstead Volume).",
    fileName: "nasa_jm1_flight_software.csv",
    modules: [
      {
        id: "mod-1",
        moduleName: "FlightControlSystem::calculateAttitude",
        loc: 184,
        cyclomaticComplexity: 24,
        halsteadVolume: 1820,
        essentialComplexity: 12,
        designComplexity: 16,
        coupling: 18,
        commentRatio: 0.08,
        actualBugLabel: "Buggy",
        sampleCode: `void calculateAttitude(double pitch, double roll, double yaw) {
  int sensorFlag = 0;
  if (pitch > 45.0 || roll > 45.0) {
    sensorFlag = 1;
    // Missing boundary check for zero divisor
    double correction = 100.0 / (pitch - roll);
    applyCorrection(correction);
  }
}`
      },
      {
        id: "mod-2",
        moduleName: "TelemetryLogger::bufferPacket",
        loc: 32,
        cyclomaticComplexity: 3,
        halsteadVolume: 210,
        essentialComplexity: 1,
        designComplexity: 2,
        coupling: 3,
        commentRatio: 0.35,
        actualBugLabel: "Non-Buggy",
        sampleCode: `bool bufferPacket(const Packet& pkt) {
  if (buffer.size() >= MAX_BUF) return false;
  buffer.push_back(pkt);
  return true;
}`
      },
      {
        id: "mod-3",
        moduleName: "NavigationEngine::computeOrbitalVector",
        loc: 240,
        cyclomaticComplexity: 31,
        halsteadVolume: 2950,
        essentialComplexity: 18,
        designComplexity: 21,
        coupling: 22,
        commentRatio: 0.05,
        actualBugLabel: "Buggy",
        sampleCode: `double computeOrbitalVector(Vector3D pos, Vector3D vel) {
  double g = 9.80665;
  for (int i = 0; i < 100; i++) {
    for (int j = 0; j < 50; j++) {
      if (i == j) {
        // Potential off-by-one index overflow
        pos.data[i + 1] = pos.data[i] * g;
      }
    }
  }
  return pos.magnitude();
}`
      },
      {
        id: "mod-4",
        moduleName: "SensorManager::readTemperatureADC",
        loc: 45,
        cyclomaticComplexity: 4,
        halsteadVolume: 380,
        essentialComplexity: 2,
        designComplexity: 3,
        coupling: 4,
        commentRatio: 0.28,
        actualBugLabel: "Non-Buggy",
        sampleCode: `float readTemperatureADC(int pin) {
  int raw = analogRead(pin);
  return (raw * 5.0) / 1024.0 * 100.0;
}`
      },
      {
        id: "mod-5",
        moduleName: "ThrusterController::pulseFiringSequence",
        loc: 156,
        cyclomaticComplexity: 19,
        halsteadVolume: 1450,
        essentialComplexity: 9,
        designComplexity: 14,
        coupling: 15,
        commentRatio: 0.12,
        actualBugLabel: "Buggy",
        sampleCode: `void pulseFiringSequence(int thrusterId, int durationMs) {
  if (thrusterId < 0 || thrusterId > 8) return;
  // Buggy state flag reuse
  bool active = false;
  while (durationMs > 0) {
    fire(thrusterId);
    durationMs -= 10;
    if (durationMs = 0) active = true; // Assignment instead of comparison
  }
}`
      },
      {
        id: "mod-6",
        moduleName: "ChecksumValidator::verifyMD5Header",
        loc: 28,
        cyclomaticComplexity: 2,
        halsteadVolume: 180,
        essentialComplexity: 1,
        designComplexity: 1,
        coupling: 2,
        commentRatio: 0.40,
        actualBugLabel: "Non-Buggy",
        sampleCode: `bool verifyMD5Header(const Header& h) {
  return h.checksum == calculateMD5(h.payload);
}`
      },
      {
        id: "mod-7",
        moduleName: "PayloadDeployer::armReleaseLatch",
        loc: 195,
        cyclomaticComplexity: 22,
        halsteadVolume: 2100,
        essentialComplexity: 11,
        designComplexity: 15,
        coupling: 19,
        commentRatio: 0.04,
        actualBugLabel: "Buggy",
        sampleCode: `void armReleaseLatch(int passCode) {
  if (passCode != 0x4F2) return;
  // Missing lock mutex protection causing race condition
  latchOpen = true;
  executeMechanicalRelease();
}`
      },
      {
        id: "mod-8",
        moduleName: "BatteryMonitor::getRemainingPercentage",
        loc: 38,
        cyclomaticComplexity: 3,
        halsteadVolume: 260,
        essentialComplexity: 1,
        designComplexity: 2,
        coupling: 3,
        commentRatio: 0.30,
        actualBugLabel: "Non-Buggy",
        sampleCode: `float getRemainingPercentage() {
  return (currentVoltage / maxVoltage) * 100.0f;
}`
      }
    ]
  },
  {
    id: "microservices-ecommerce",
    name: "Enterprise Microservices Suite",
    description: "TypeScript/Node.js & Java spring-boot microservice components dataset with coupling and code churn indicators.",
    fileName: "ecommerce_microservices_metrics.csv",
    modules: [
      {
        id: "ms-1",
        moduleName: "PaymentGatewayService::processStripeCharge",
        loc: 210,
        cyclomaticComplexity: 26,
        halsteadVolume: 2300,
        essentialComplexity: 14,
        designComplexity: 18,
        coupling: 24,
        commentRatio: 0.06,
        actualBugLabel: "Buggy",
        sampleCode: `async function processStripeCharge(amount, currency, cardToken) {
  let response;
  try {
    response = await stripe.charges.create({ amount, currency, source: cardToken });
  } catch (err) {
    // Unhandled promise rejection & missing rollback
    console.log(err);
  }
  return response.id; // TypeError if response is undefined
}`
      },
      {
        id: "ms-2",
        moduleName: "InventoryService::checkStockAvailability",
        loc: 52,
        cyclomaticComplexity: 5,
        halsteadVolume: 420,
        essentialComplexity: 2,
        designComplexity: 3,
        coupling: 5,
        commentRatio: 0.25,
        actualBugLabel: "Non-Buggy",
        sampleCode: `async function checkStockAvailability(productId, qty) {
  const item = await db.inventory.findOne({ productId });
  return item && item.stock >= qty;
}`
      },
      {
        id: "ms-3",
        moduleName: "OrderProcessor::reconcileCartItems",
        loc: 175,
        cyclomaticComplexity: 21,
        halsteadVolume: 1890,
        essentialComplexity: 11,
        designComplexity: 15,
        coupling: 17,
        commentRatio: 0.09,
        actualBugLabel: "Buggy",
        sampleCode: `function reconcileCartItems(cart) {
  for (let i = 0; i < cart.items.length; i++) {
    for (let j = 0; j < cart.discounts.length; j++) {
      if (cart.items[i].id === cart.discounts[j].itemId) {
        // Mutation inside nested loop leading to NaN price
        cart.items[i].price -= cart.discounts[j].amount;
      }
    }
  }
}`
      },
      {
        id: "ms-4",
        moduleName: "NotificationService::sendSMSAlert",
        loc: 40,
        cyclomaticComplexity: 4,
        halsteadVolume: 310,
        essentialComplexity: 2,
        designComplexity: 2,
        coupling: 4,
        commentRatio: 0.32,
        actualBugLabel: "Non-Buggy"
      },
      {
        id: "ms-5",
        moduleName: "UserAuth::generateJWTRefreshToken",
        loc: 60,
        cyclomaticComplexity: 6,
        halsteadVolume: 500,
        essentialComplexity: 3,
        designComplexity: 4,
        coupling: 6,
        commentRatio: 0.22,
        actualBugLabel: "Non-Buggy"
      },
      {
        id: "ms-6",
        moduleName: "ShippingCalculator::calculateFedExRates",
        loc: 290,
        cyclomaticComplexity: 34,
        halsteadVolume: 3400,
        essentialComplexity: 20,
        designComplexity: 25,
        coupling: 28,
        commentRatio: 0.02,
        actualBugLabel: "Buggy"
      }
    ]
  }
];
