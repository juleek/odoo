/* @odoo-module */

import { useOpenChat } from "@mail/core/web/open_chat_hook";
import { useAssignUserCommand } from "@mail/views/web/fields/assign_user_command_hook";

import { registry } from "@web/core/registry";
import { TagsList } from "@web/core/tags_list/tags_list";
import { patch } from "@web/core/utils/patch";
import { usePopover } from "@web/core/popover/popover_hook";
import { browser } from "@web/core/browser/browser";
import { AvatarCardPopover } from "@mail/discuss/web/avatar_card/avatar_card_popover";
import {
    Many2ManyTagsAvatarField,
    many2ManyTagsAvatarField,
    ListMany2ManyTagsAvatarField,
    listMany2ManyTagsAvatarField,
    KanbanMany2ManyTagsAvatarField,
    kanbanMany2ManyTagsAvatarField,
    KanbanMany2ManyTagsAvatarFieldTagsList,
} from "@web/views/fields/many2many_tags_avatar/many2many_tags_avatar_field";

export class Many2ManyAvatarUserTagsList extends TagsList {}
Many2ManyAvatarUserTagsList.template = "mail.Many2ManyAvatarUserTagsList";

const userChatter = {
    setup() {
        this._super(...arguments);
        this.openChat = useOpenChat(this.relation);
        if (this.props.withCommand) {
            useAssignUserCommand();
        }
        this.avatarCard = usePopover(AvatarCardPopover, {
            closeOnHoverAway: true,
        });
        this.openTimeout = false;
        this.lastOpenedId = 0;
    },

    getTagProps(record) {
        return {
            ...this._super(...arguments),
            onImageClicked: () => this.openChat(record.resId),
            openCard: (ev) => {
                if (this.env.isSmall) {
                    return;
                }
                const target = ev.currentTarget;
                this.openTimeout = browser.setTimeout(() => {
                    if (
                        !this.avatarCard.isOpen ||
                        (this.lastOpenedId && record.resId !== this.lastOpenedId)
                    ) {
                        this.avatarCard.open(target, {
                            id: record.resId,
                            relation: this.relation,
                        });
                        this.lastOpenedId = record.resId;
                    }
                }, 350);
            },
            clearTimeout: () => {
                browser.clearTimeout(this.openTimeout);
                delete this.openTimeout;
            },
        };
    },
};
export class Many2ManyTagsAvatarUserField extends Many2ManyTagsAvatarField {
    static components = {
        ...Many2ManyTagsAvatarField.components,
        TagsList: Many2ManyAvatarUserTagsList,
    };
}
patch(Many2ManyTagsAvatarUserField.prototype, "mail/fields/web", userChatter);

export const many2ManyTagsAvatarUserField = {
    ...many2ManyTagsAvatarField,
    component: Many2ManyTagsAvatarUserField,
    additionalClasses: ["o_field_many2many_tags_avatar"],
};

registry.category("fields").add("many2many_avatar_user", many2ManyTagsAvatarUserField);

export class KanbanMany2ManyAvatarUserTagsList extends KanbanMany2ManyTagsAvatarFieldTagsList {
    static template = "mail.KanbanMany2ManyAvatarUserTagsList";
}

export class KanbanMany2ManyTagsAvatarUserField extends KanbanMany2ManyTagsAvatarField {
    static template = "mail.KanbanMany2ManyTagsAvatarUserField";
    static components = {
        ...KanbanMany2ManyTagsAvatarField.components,
        TagsList: KanbanMany2ManyAvatarUserTagsList,
    };
    get displayText() {
        return !this.props.readonly;
    }
}
patch(KanbanMany2ManyTagsAvatarUserField.prototype, "mail/fields/web", userChatter);
export const kanbanMany2ManyTagsAvatarUserField = {
    ...kanbanMany2ManyTagsAvatarField,
    component: KanbanMany2ManyTagsAvatarUserField,
    additionalClasses: ["o_field_many2many_tags_avatar", "o_field_many2many_tags_avatar_kanban"],
};
registry.category("fields").add("kanban.many2many_avatar_user", kanbanMany2ManyTagsAvatarUserField);

export class ListMany2ManyTagsAvatarUserField extends ListMany2ManyTagsAvatarField {
    static template = "mail.ListMany2ManyTagsAvatarUserField";
    static components = {
        ...ListMany2ManyTagsAvatarField.components,
        TagsList: Many2ManyAvatarUserTagsList,
    };

    get displayText() {
        return this.props.record.data[this.props.name].records.length === 1 || !this.props.readonly;
    }
}
patch(ListMany2ManyTagsAvatarUserField.prototype, "mail/fields/web", userChatter);

export const listMany2ManyTagsAvatarUserField = {
    ...listMany2ManyTagsAvatarField,
    component: ListMany2ManyTagsAvatarUserField,
    additionalClasses: ["o_field_many2many_tags_avatar", "o_field_many2many_tags_avatar_list"],
};

registry.category("fields").add("list.many2many_avatar_user", listMany2ManyTagsAvatarUserField);
registry
    .category("fields")
    .add("activity.many2many_avatar_user", kanbanMany2ManyTagsAvatarUserField);
