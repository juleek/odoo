import { defineMenus, makeMockEnv } from "@web/../tests/web_test_helpers";
import { describe, expect, test } from "@odoo/hoot";

import { Model } from "@odoo/o-spreadsheet";
import { createBasicChart } from "@spreadsheet/../tests/helpers/commands";

const chartId = "uuid1";

describe.current.tags("headless");
defineMenus([
    {
        id: "root",
        children: [1, 2],
        name: "root",
        appID: "root",
    },
    {
        id: 1,
        children: [],
        name: "test menu 1",
        xmlid: "documents_spreadsheet.test.menu",
        appID: 1,
        actionID: "menuAction",
    },
    {
        id: 2,
        children: [],
        name: "test menu 2",
        xmlid: "documents_spreadsheet.test.menu2",
        appID: 1,
        actionID: "menuAction2",
    },
]);

test("Links between charts and ir.menus are correctly imported/exported", async function () {
    const env = await makeMockEnv();
    const model = new Model({}, { custom: { env } });
    createBasicChart(model, chartId);
    model.dispatch("LINK_ODOO_MENU_TO_CHART", {
        chartId,
        odooMenuId: 1,
    });
    const exportedData = model.exportData();
    expect(exportedData.chartOdooMenusReferences[chartId]).toBe(1, {
        message: "Link to odoo menu is exported",
    });
    const importedModel = new Model(exportedData, { custom: { env } });
    const chartMenu = importedModel.getters.getChartOdooMenu(chartId);
    expect(chartMenu.id).toBe(1, { message: "Link to odoo menu is imported" });
});

test("Can undo-redo a LINK_ODOO_MENU_TO_CHART", async function () {
    const env = await makeMockEnv();
    const model = new Model({}, { custom: { env } });
    createBasicChart(model, chartId);
    model.dispatch("LINK_ODOO_MENU_TO_CHART", {
        chartId,
        odooMenuId: 1,
    });
    expect(model.getters.getChartOdooMenu(chartId).id).toBe(1);
    model.dispatch("REQUEST_UNDO");
    expect(model.getters.getChartOdooMenu(chartId)).toBe(undefined);
    model.dispatch("REQUEST_REDO");
    expect(model.getters.getChartOdooMenu(chartId).id).toBe(1);
});

test("link is removed when figure is deleted", async function () {
    const env = await makeMockEnv();
    const model = new Model({}, { custom: { env } });
    createBasicChart(model, chartId);
    model.dispatch("LINK_ODOO_MENU_TO_CHART", {
        chartId,
        odooMenuId: 1,
    });
    expect(model.getters.getChartOdooMenu(chartId).id).toBe(1);
    model.dispatch("DELETE_FIGURE", {
        sheetId: model.getters.getActiveSheetId(),
        id: chartId,
    });
    expect(model.getters.getChartOdooMenu(chartId)).toBe(undefined);
});
