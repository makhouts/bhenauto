import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeVehicleDescription,
  translateColorLabel,
  translateFuelLabel,
  translateTransmissionLabel,
  unknownVehicleLabel,
} from "./presentation-format";

test("normalizes AutoScout descriptions for website rendering", () => {
  const normalized = normalizeVehicleDescription(
    "**Véhicule livré avec contrôle technique et car-pass.**\\\\Wij spreken Nederlands / Nous parlons Francais / We speak English\\Service après-vente",
  );

  assert.equal(
    normalized,
    "Véhicule livré avec contrôle technique et car-pass.\nWij spreken Nederlands / Nous parlons Francais / We speak English\nService après-vente",
  );
});

test("translates known fuel, color and transmission labels across locales", () => {
  assert.equal(translateFuelLabel("Benzine", "fr"), "Essence");
  assert.equal(translateFuelLabel("Electrique", "nl"), "Elektrisch");
  assert.equal(translateFuelLabel("plugin_hybrid", "fr"), "Hybride rechargeable");
  assert.equal(translateFuelLabel("Elektrisch/Benzine", "fr"), "Electrique/Essence");
  assert.equal(translateColorLabel("Grijs", "en"), "Grey");
  assert.equal(translateColorLabel("Noir", "nl"), "Zwart");
  assert.equal(translateTransmissionLabel("Handgeschakeld", "fr"), "Manuelle");
  assert.equal(translateTransmissionLabel("Automatique", "en"), "Automatic");
});

test("returns localized unknown labels", () => {
  assert.equal(unknownVehicleLabel("nl"), "Onbekend");
  assert.equal(unknownVehicleLabel("fr"), "Inconnu");
  assert.equal(unknownVehicleLabel("en"), "Unknown");
});
