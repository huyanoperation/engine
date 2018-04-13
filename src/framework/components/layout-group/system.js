pc.extend(pc, function () {
    var _schema = [ 'enabled' ];

    /**
     * @name pc.LayoutGroupComponentSystem
     * @description Create a new LayoutGroupComponentSystem
     * @class Manages creation of {@link pc.LayoutGroupComponent}s.
     * @param {pc.Application} app The application
     * @extends pc.ComponentSystem
     */
    var LayoutGroupComponentSystem = function LayoutGroupComponentSystem(app) {
        this.id = 'layoutgroup';
        this.app = app;
        app.systems.add(this.id, this);

        this.ComponentType = pc.LayoutGroupComponent;
        this.DataType = pc.LayoutGroupComponentData;

        this.schema = _schema;

        this._reflowQueue = [];

        this.on('beforeremove', this._onRemoveComponent, this);
        pc.ComponentSystem.on('postUpdate', this._onPostUpdate, this);
    };
    LayoutGroupComponentSystem = pc.inherits(LayoutGroupComponentSystem, pc.ComponentSystem);

    pc.Component._buildAccessors(pc.LayoutGroupComponent.prototype, _schema);

    pc.extend(LayoutGroupComponentSystem.prototype, {
        initializeComponentData: function (component, data, properties) {
            if (data.orientation !== undefined) component.orientation = data.orientation;
            if (data.reverse !== undefined) component.reverse = data.reverse;
            if (data.alignment !== undefined) {
                if (data.alignment instanceof pc.Vec2){
                    component.alignment.copy(data.alignment);
                } else {
                    component.alignment.set(data.alignment[0], data.alignment[1]);
                }
                // force update
                component.alignment = component.alignment;
            }
            if (data.padding !== undefined) {
                if (data.padding instanceof pc.Vec4){
                    component.padding.copy(data.padding);
                } else {
                    component.padding.set(data.padding[0], data.padding[1], data.padding[2], data.padding[3]);
                }
                // force update
                component.padding = component.padding;
            }
            if (data.widthFitting !== undefined) component.widthFitting = data.widthFitting;
            if (data.heightFitting !== undefined) component.heightFitting = data.heightFitting;
            if (data.wrap !== undefined) component.wrap = data.wrap;

            LayoutGroupComponentSystem._super.initializeComponentData.call(this, component, data, properties);

            component.on('schedulereflow', this._onScheduleReflow, this);
        },

        cloneComponent: function (entity, clone) {
            var layoutGroup = entity.layoutgroup;

            return this.addComponent(clone, {
                enabled: layoutGroup.enabled,
                orientation: layoutGroup.orientation,
                reverse: layoutGroup.reverse,
                alignment: layoutGroup.alignment,
                padding: layoutGroup.padding,
                widthFitting: layoutGroup.widthFitting,
                heightFitting: layoutGroup.heightFitting,
                wrap: layoutGroup.wrap,
            });
        },

        _onScheduleReflow: function (entity, component) {
            if (this._reflowQueue.indexOf(component) === -1) {
                this._reflowQueue.push(component);
            }
        },

        _onPostUpdate: function () {
            // Sort in ascending order of depth within the graph (i.e. outermost first), so that
            // any layout groups which are children of other layout groups will always have their
            // new size set before their own reflow is calculated.
            this._reflowQueue.sort(function(componentA, componentB) {
                return componentA.entity.graphDepth < componentB.entity.graphDepth;
            });

            this._reflowQueue.forEach(function(component) {
                component.reflow();
            });

            // TODO Handle additional items being pushed to the reflow queue while a reflow is taking place?

            this._reflowQueue = [];
        },

        _onRemoveComponent: function (entity, component) {
            component.off('schedulereflow', this._onScheduleReflow, this);
            component.onRemove();
        }
    });

    return {
        LayoutGroupComponentSystem: LayoutGroupComponentSystem
    };
}());