/** @odoo-module **/

import { start, startServer } from "@mail/../tests/helpers/test_utils";
import { patchWithCleanup, triggerEvent, getFixture, getNodesTextContent } from "@web/../tests/helpers/utils";
import { registry } from "@web/core/registry";
import { browser } from "@web/core/browser/browser";
import { EventBus } from "@odoo/owl";
import { AvatarCardPopover } from "@mail/discuss/web/avatar_card/avatar_card_popover";
import { patchAvatarCardPopover } from "@hr/components/avatar_card/avatar_card_popover_patch";

const fakeMultiTab = {
    start() {
        const bus = new EventBus();
        return {
            bus,
            get currentTabId() {
                return null;
            },
            isOnMainTab() {
                return true;
            },
            getSharedValue(key, defaultValue) {
                return "";
            },
            setSharedValue(key, value) {},
            removeSharedValue(key) {},
        };
    },
};

const fakeImStatusService = {
    start() {
        return {
            registerToImStatus() {},
            unregisterFromImStatus() {},
        };
    },
};

let target;

QUnit.module("M2XAvatarUser", ({ beforeEach }) => {
    beforeEach(() => {
        target = getFixture();
        patchWithCleanup(AvatarCardPopover.prototype, patchAvatarCardPopover);
        registry.category("services").add("multi_tab", fakeMultiTab, { force: true });
        registry.category("services").add("im_status", fakeImStatusService, { force: true });
    });

    QUnit.test("avatar card preview with hr", async (assert) => {
        const pyEnv = await startServer();
        const departmentId = pyEnv["hr.department"].create({
            name: "Managemment"
        });
        const userId = pyEnv["res.users"].create({
            name: "Mario",
            email: "Mario@odoo.test",
            im_status: "online",
            work_phone: "+585555555",
            job_title: "sub manager",
            department_id: departmentId,
        });
        const mockRPC = (route, args) => {
            if(route === "/web/dataset/call_kw/res.users/read"){
                assert.deepEqual(args.args[1], ['name', 'email', 'im_status',
                "work_phone",
                "job_title",
                "department_id",
                "employee_parent_id",
                "employee_id"]);
                assert.step("user read");
            }
        };
        const avatarUserId = pyEnv["m2x.avatar.user"].create({ user_id: userId });
        const views = {
            "m2x.avatar.user,false,kanban": `
                    <kanban>
                        <templates>
                            <t t-name="kanban-box">
                                <div>
                                    <field name="user_id" widget="many2one_avatar_user"/>
                                </div>
                            </t>
                        </templates>
                    </kanban>`,
        };
        const { openView } = await start({ serverData: { views }, mockRPC });
        await openView({
            res_model: "m2x.avatar.user",
            res_id: avatarUserId,
            views: [[false, "kanban"]],
        });
        
        patchWithCleanup(browser, {
            setTimeout: (callback, delay) => {
                assert.step(`setTimeout of ${delay}ms`);
                callback();
            },
        });
        // Open card
        await triggerEvent(target, ".o_m2o_avatar > img", "mouseover");
        assert.verifySteps(["setTimeout of 350ms", "user read"]);
        assert.containsOnce(target, ".o_avatar_card");
        assert.deepEqual(getNodesTextContent(target.querySelectorAll(".o_card_user_infos > *")), ['Mario', 'sub manager', 'Managemment', ' Mario@odoo.test', ' +585555555']);
        // Close card
        await triggerEvent(target, ".o_control_panel", "mouseover");
        assert.verifySteps(["setTimeout of 400ms"]);
        assert.containsNone(target, ".o_avatar_card");
    });
});
