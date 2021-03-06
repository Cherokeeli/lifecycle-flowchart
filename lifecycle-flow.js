//==========================================================================
//
//生命周期流程展示
//
//========================================================================

//svg命名空间
const NAMESPACE = "http://www.w3.org/2000/svg";
//状态枚举
const [ACTIVE, IDLE, RTODO, HIDDEN] = [Symbol('ACTIVE'), Symbol('IDLE'), Symbol('RTODO'), Symbol('HIDDEN')];

function getChildrenIndex(ele) { //获取是第几个子节点
    let i = 0;
    while (ele.previousElementSibling) {
        ele = ele.previousElementSibling;
        i++;
    }
    return i;
}

let style = `
    .lifecycle-tip {
        width: auto !important;
        float:left;
        padding:5px;
        box-shadow: 0 0 10px #ccc;
        border-radius: 6px;
        height:30px;
        background-color:white;
        position:fixed;
    }
    .active-path {
        stroke-dasharray: 50;
        stroke-dashoffset: 500;
        animation: dash 5s linear infinite;
        animation-fill-mode: forwards;
    }

    .init-path {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation: dash 2s linear alternate;
        animation-fill-mode: forwards;
    }

    @keyframes dash {
        to {
            stroke-dashoffset: 0;
        }
    }

    .hide-playground, .show-playground {
        position: fixed;
        /*top: 100px;*/
        width: 80%;
        height:1000px;
        background-color: white;
        border-radius: 20px;
        box-shadow: 0 0 10px #ccc;
        z-index: 9999;
    }

    .hide-playground {
        top: 100%;
        left: 10%;
        transition: top 1s;
        z-index: 9999;
    }

    .show-playground {
        top: 0;
        left: 10%;
        transition: top 1s;
        z-index: 9999;
    }

    #playground {
        overflow: visible !important;
    }

    .closeLifecycle {
        display: block;
        position: relative;
        top: 10px;
        left: 20px;
        font-size: 30px;
        width: 30px;
        height: 30px;
        line-height: 30px;
        padding: 10px;
    }
    
    .clickable-link {
        cursor: pointer
    }
    
    .dropable-list {
        cursor: s-resize
    }
            `;

// 加载生命周期导航图的css
(function (style) {
    if (document.all) { // document.createStyleSheet(url)
        window.style = style;
        document.createStyleSheet("javascript:style");
    } else { //document.createElement(style)
        let sty = document.createElement('style');
        sty.type = 'text/css';
        sty.innerHTML = style;
        document.getElementsByTagName('HEAD').item(0).appendChild(sty);
    }
})(style);

/**
 * 设定包裹svg的高度
 * @param dom       svg节点
 * @param height    想设置的高度
 */
function setSVGWrapperHeight(dom, height) {
    dom.parentElement.style.height = `${height + 20}px`;
}

SVGElement.prototype.addClass = function (new_class) {
    let current_class = this.getAttribute('class');
    current_class += ` ${new_class}`;
    this.setAttribute('class', current_class);
};

SVGElement.prototype.setAttributeItems = function (attributes) {
    for (let attr in attributes) {
        if (attributes.hasOwnProperty(attr)) this.setAttribute(attr, attributes[attr]);
    }
};

SVGElement.prototype.removeThisNode = function () {
    let bin = document.createDocumentFragment();
    bin.appendChild(this);
    bin = null;
};

/**
 * 动画工具类，svg动画等
 */
class AnimationHelper {
    constructor() {
    }

    /**
     * 加入描边动画
     * @param path  {SVGPathElement | *}    path标签
     */
    static addPathAnimation(path) {
        //svg的className没有setter方法
        // path.className += "active-path";
        path.addClass("init-path");
    }

    static addActivePathAnimation(path) {
        path.addClass("active-path");
    }

    /**
     *生成的小车-没有用
     * @return {SVGElement}     返回小车image
     */
    static generateCarSvg() {
        let img = document.createElementNS(NAMESPACE, 'image');
        img.setAttributeItems({
            "xlink:href": "../../../views/img/car.svg",
            "height": 33.8,
            "width": 55
        });
        return img;
    }
}

/**
 * svg工具类，转换，属性重置等
 */
class GraphHelper {
    constructor() {
    }

    /**
     * 将生命周期下的svg重新组装，更好的使用动画
     * @param lifecycle_term    {LifecycleLink}    生命周期阶段
     */
    static reconstructPath(lifecycle_term) {
        lifecycle_term.workflow.forEach(function (flow_node, flow_index) {
            let current_actions_num = flow_node.action.length;
            flow_node.action.forEach(function (action_node, action_index) {
                //console.log(action_node.firstChild && action_node.firstChild.tagName==="path");

                if (action_node.dom_model.firstChild && action_node.dom_model.firstChild.tagName === "path" && action_index >= 1) {
                    flow_node.action[action_index - 1].next_dom_model.appendChild(action_node.dom_model.firstChild);
                }
                //console.log(action_node.lastChild && action_node.lastChild.tagName==="path");
                if (action_node.dom_model.lastChild && action_node.dom_model.lastChild.tagName === "path") {
                    action_node.next_dom_model.insertBefore(action_node.dom_model.lastChild, action_node.next_dom_model.firstChild);
                }
            });
        });
    }

    /**
     * 将svg组转换成一个path节点
     * @param svg_group {SVGElement}    svg组，包含很多path元素
     * @return  {SVGPathElement}        组合好的path节点
     */
    static compilePath(svg_group) {
        let total_path = document.createElementNS(NAMESPACE, 'path');
        let paths = svg_group.querySelectorAll("path");
        let total_path_pattern = [].map.call(paths, function (path) {
            return (path.getAttribute('d')).replace('Z', "");
        });
        let format_pattern = total_path_pattern.join(" ").split(" ");
        format_pattern.forEach(function (current, index, arr) {
            if (index !== 0 && current === "M") {
                format_pattern.splice(index, 3);
            }
        });
        total_path.setAttribute('d', format_pattern.join(" "));
        for (let i = 0; i < paths.length; i++) {
            if (paths[i].getAttribute('stroke') && paths[i].getAttribute('stroke-width')) {
                total_path.setAttribute('stroke', paths[i].getAttribute('stroke'));
                total_path.setAttribute('stroke-width', paths[i].getAttribute('stroke-width'));
            }
        }

        total_path.setAttribute('fill', 'transparent');

        return total_path;
    }
}

/**
 * 基础svg绘图类
 */
class Pencil {

    /**
     * @constructor
     * @param  {Number} origin_x    初始化横坐标
     * @param  {Number} origin_y    初始化纵坐标
     * @param  {Number} line_width  画线的宽度
     * @param  {String} color       线条颜色
     */
    constructor(origin_x, origin_y, line_width, color) {
        this.x = origin_x;
        this.y = origin_y;
        this.line_width = line_width;
        this.color = color;
        this.seq = 0;
        this.seq_draw = [];
        Pencil.prototype.x = this.x;
        Pencil.prototype.y = this.y;
    }

    /**
     * 从底向右画弧
     * @param  {Number}     arc             弧线半径
     * @param  {Number}     [direction=0]   0是逆时针画，1是顺时针画，默认0
     * @param  {String}     class_name      类名
     */
    drawBottomToRightArc(arc,
                         direction = 0,
                         class_name = "") { //direction: 0 正向，1 逆向
        let pen = document.createElementNS(NAMESPACE, 'path');

        pen.setAttribute('d', `M ${this.x} ${this.y} A ${arc} ${arc},0,0,${direction},${this.x + arc} ${this.y - arc} M ${this.x + arc} ${this.y - arc} Z`);
        pen.setAttribute('stroke', this.color);
        pen.setAttribute('stroke-width', this.line_width);
        pen.setAttribute('fill', 'transparent');
        pen.setAttribute('class', class_name);
        if (!this.seq) {
            return pen;
        } else {
            this.x = this.x + arc;
            this.y = this.y - arc;
            this.seq_draw.push(pen);
            return this;
        }
    }

    /**
     * 从左向下画弧
     * @param  {Number}     arc             弧线半径
     * @param  {Number}     [direction=0]   0是逆时针画，1是顺时针画，默认0
     * @param  {String}     class_name      类名
     */
    drawLeftToBottomArc(arc,
                        direction = 0,
                        class_name = "") {
        let pen = document.createElementNS(NAMESPACE, 'path');

        pen.setAttribute('d', `M ${this.x} ${this.y} A ${arc} ${arc},0,0,${direction},${this.x + arc} ${this.y + arc} M ${this.x + arc} ${this.y + arc} Z`);
        pen.setAttribute('stroke', this.color);
        pen.setAttribute('stroke-width', this.line_width);
        pen.setAttribute('fill', 'transparent');
        pen.setAttribute('class', class_name);
        if (!this.seq) {
            return pen;
        } else {
            this.x = this.x + arc;
            this.y = this.y + arc;
            this.seq_draw.push(pen);
            return this;
        }
    }

    /**
     * 从右往上画弧
     * @param  {Number}     arc             弧线半径
     * @param  {Number}     [direction=0]   0是逆时针画，1是顺时针画，默认0
     * @param  {String}     class_name      类名
     */
    drawRightToUpArc(arc,
                     direction = 0,
                     class_name = "") {
        let pen = document.createElementNS(NAMESPACE, 'path');

        pen.setAttribute('d', `M ${this.x} ${this.y} A ${arc} ${arc},0,0,${direction},${this.x - arc} ${this.y - arc} M ${this.x - arc} ${this.y - arc} Z`);
        pen.setAttribute('stroke', this.color);
        pen.setAttribute('stroke-width', this.line_width);
        pen.setAttribute('fill', 'transparent');
        pen.setAttribute('class', class_name);
        if (!this.seq) {
            return pen;
        } else {
            this.x = this.x - arc;
            this.y = this.y - arc;
            this.seq_draw.push(pen);
            return this;
        }
    }

    /**
     * 从上往左画弧
     * @param  {Number}     arc             弧线半径
     * @param  {Number}     [direction=0]   0是逆时针画，1是顺时针画，默认0
     * @param  {String}     class_name      类名
     */
    drawUpToLeftArc(arc,
                    direction = 0,
                    class_name = "") {
        let pen = document.createElementNS(NAMESPACE, 'path');

        pen.setAttribute('d', `M ${this.x} ${this.y} A ${arc} ${arc},0,0,${direction},${this.x - arc} ${this.y + arc} M ${this.x - arc} ${this.y + arc} Z`);
        pen.setAttribute('stroke', this.color);
        pen.setAttribute('stroke-width', this.line_width);
        pen.setAttribute('fill', 'transparent');
        pen.setAttribute('class', class_name);
        if (!this.seq) {
            return pen;
        } else {
            this.x = this.x - arc;
            this.y = this.y + arc;
            this.seq_draw.push(pen);
            return this;
        }
    }

    /**
     * 向下画直线
     * @param  {Number}     len         划线长度
     * @param  {Number}     direction   划线方向，0是向下，1是向上，默认0
     * @param  {String}     class_name  类名
     */
    drawDownwardLine(len,
                     direction = 0,
                     class_name = "") {
        let line = document.createElementNS(NAMESPACE, 'path');
        let next_y;

        line.setAttribute('stroke', this.color);
        line.setAttribute('stroke-width', this.line_width);
        if (!direction) {
            next_y = this.y + len;
        } else {
            next_y = this.y - len;
        }
        line.setAttribute('d', `M ${this.x} ${this.y} L ${this.x} ${next_y} Z`);
        line.setAttribute('class', class_name);
        if (!this.seq) {
            return line;
        } else {
            this.y = next_y;
            this.seq_draw.push(line);
            return this;
        }
    }

    /**
     * 向右画直线
     * @param  {Number}     len             线条长度
     * @param  {Number}     direction       线条方向，0是向右，1是向左，默认0
     * @param  {String}     stroke_color    线条颜色
     * @param  {String}     class_name      类名
     */
    drawRightWardLine(len,
                      direction = 0,
                      stroke_color = this.color,
                      class_name = "") {
        let line = document.createElementNS(NAMESPACE, 'path');
        let next_x;

        line.setAttribute('stroke', stroke_color || this.color);
        line.setAttribute('stroke-width', this.line_width);
        if (!direction) {
            next_x = this.x + len;
        } else {
            next_x = this.x - len;
        }
        line.setAttribute('d', `M ${this.x} ${this.y} L ${next_x} ${this.y} Z`);
        line.setAttribute('class', class_name);
        if (!this.seq) {
            return line;
        } else {
            this.x = next_x;
            this.seq_draw.push(line);
            return this;
        }
    }

    /**
     * 按照设定半径画圆
     * @param  {Number} radius          画圆半径
     * @param  {String} color           填充颜色
     * @param  {String} stroke_color    线条颜色
     * @param  {String} class_name      类选择器名
     */
    drawCircle(radius,
               color = 'transparent',
               stroke_color = this.color,
               class_name = "") {
        let circle = document.createElementNS(NAMESPACE, 'circle');
        circle.setAttribute('cx', this.x);
        circle.setAttribute('cy', this.y);
        circle.setAttribute('r', radius);
        circle.setAttribute('stroke', stroke_color);
        circle.setAttribute('stroke-width', this.line_width);
        circle.setAttribute('fill', color);
        circle.setAttribute('style', 'z-index:999');
        circle.setAttribute('class', class_name);
        if (!this.seq) {
            return circle;
        } else {
            this.seq_draw.push(circle);
            return this;
        }
    }

    /**
     * 画文字信息
     * @param  {String} content     文字描述
     * @param  {String} anchor      文字对齐，默认middle
     * @param  {Number} size        文字字号
     * @param  {Number} x_offset    向右偏移量
     * @param  {Number} y_offset    向左偏移量
     * @param  {String} color       文字颜色
     * @param  {String} class_name  类名
     * @param  {Boolean} should_ellipsis 是否该省略，默认false
     */
    drawTextAnnotation(content,
                       anchor = "middle",
                       size = 15,
                       x_offset = 0,
                       y_offset = 0,
                       color = "silver",
                       class_name = "",
                       should_ellipsis = false) {
        let text = document.createElementNS(NAMESPACE, 'text');
        text.setAttribute('x', this.x + Number(x_offset));
        text.setAttribute('y', this.y + Number(y_offset));
        text.setAttribute('text-anchor', anchor);
        text.setAttribute('font-size', size);
        text.setAttribute('stroke', color);
        text.setAttribute('class', class_name);
        let substr;
        if (should_ellipsis) {
            substr = content.substring(0, 5);
            if (content.length > 5) substr += "..."
        } else {
            substr = content.substring(0, 10);
            if (content.length > 10) substr += "..."
        }
        text.textContent = substr || content;
        this.be_ellipsis = text.textContent.match(/\.\.\./);
        if (!this.seq) {
            return text;
        } else {
            this.seq_draw.push(text);
            return this;
        }
    }

    /**
     * 画斜线
     * @param  {Number}     length_of_line  划线长度
     * @param  {Number}     direction       划线上下方向，0是向上，1是向下，默认0
     * @param  {Number}     left_or_right   划线左右方向，0是向左，1是向右，默认0
     * @param  {Number}     angles          画斜线角度
     * @param  {String}     stroke_color    线条颜色
     * @param  {String}     class_name      类名
     */
    drawBiasLine(length_of_line,
                 direction = 0,
                 left_or_right = 0,
                 angles = 45,
                 stroke_color = this.color,
                 class_name = "") {

        let angle = angles || 45;
        let line = document.createElementNS(NAMESPACE, 'path');
        let next_x = this.x, next_y = this.y;

        line.setAttribute('stroke', stroke_color || this.color);
        line.setAttribute('stroke-width', this.line_width);

        function transAngle() {
            return angle * ((2 * Math.PI) / 360);
        }

        if (direction === 0 && left_or_right === 0) {
            next_x = this.x - length_of_line * Math.cos(transAngle(angle));
            next_y = this.y - length_of_line * Math.sin(transAngle(angle));
            line.setAttribute('d', `M ${this.x} ${this.y} L ${next_x} ${next_y} Z`);
        } else if (direction === 0 && left_or_right === 1) {
            next_x = this.x + length_of_line * Math.cos(transAngle(angle));
            next_y = this.y - length_of_line * Math.sin(transAngle(angle));
            line.setAttribute('d', `M ${this.x} ${this.y} L ${next_x} ${next_y} Z`);
        } else if (direction === 1 && left_or_right === 0) {
            next_x = this.x - length_of_line * Math.cos(transAngle(angle));
            next_y = this.y + length_of_line * Math.sin(transAngle(angle));
            line.setAttribute('d', `M ${this.x} ${this.y} L ${next_x} ${next_y} Z`);
        } else if (direction === 1 && left_or_right === 1) {
            next_x = this.x + length_of_line * Math.cos(transAngle(angle));
            next_y = this.y + length_of_line * Math.sin(transAngle(angle));
            line.setAttribute('d', `M ${this.x} ${this.y} L ${next_x} ${next_y} Z`);
        }
        line.setAttribute('class', class_name);
        if (!this.seq) {
            return line;
        } else {
            this.x = next_x;
            this.y = next_y;
            this.seq_draw.push(line);
            return this;
        }
    }

    /**
     * 画六边形
     * @param  {Number}   length_of_line     六边形边长
     * @param  {String}   fill_color         六边形填充颜色
     * @param  {Number}   stroke_width       线的宽度
     * @param  {String}   stroke_color       线的颜色
     * @param  {String}   class_name         类名
     */
    drawSixAnglePoly(length_of_line,
                     fill_color = "transparent",
                     stroke_width = this.line_width,
                     stroke_color = this.color,
                     class_name = "") {
        function transAngle(angle) {
            return angle * ((2 * Math.PI) / 360);
        }

        let poly = document.createElementNS(NAMESPACE, 'path'),
            cos_len = length_of_line * Math.cos(transAngle(60)),
            sin_len = length_of_line * Math.sin(transAngle(60));
        poly.setAttribute('d', `M ${this.x} ${this.y} 
                                L ${this.x + cos_len} ${this.y - sin_len} 
                                L ${this.x + cos_len + length_of_line} ${this.y - sin_len}
                                L ${this.x + cos_len + length_of_line + cos_len} ${this.y}
                                L ${this.x + cos_len + length_of_line} ${this.y + sin_len}
                                L ${this.x + cos_len} ${this.y + sin_len}
                                L ${this.x} ${this.y}`);
        poly.setAttribute('fill', fill_color);
        poly.setAttribute('stroke', stroke_color);
        poly.setAttribute('stroke-width', stroke_width);
        poly.setAttribute('class', class_name);
        if (!this.seq) {
            return poly;
        } else {
            // this.x = this.x+cos_len+len+cos_len;
            // this.y = this.y;
            this.seq_draw.push(poly);
            return this;
        }
    }

    /**
     * 画矩形
     * @param  {Number} width       矩形宽度
     * @param  {Number} height      矩形高度
     * @param  {String} color       填充颜色
     * @param  {String} line_color  线的颜色
     * @param  {Number} radius      圆角的半径
     */
    drawRectangle(width, height, color, line_color = this.color, radius = 0) {
        let rad_x = radius,
            rad_y = radius;
        let rect = document.createElementNS(NAMESPACE, 'rect');
        rect.setAttribute('x', this.x);
        rect.setAttribute('y', this.y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('stroke-width', this.line_width);
        rect.setAttribute('stroke', line_color);
        rect.setAttribute('rx', rad_x);
        rect.setAttribute('ry', rad_y);
        rect.setAttribute('style', `fill:${color}`);
        if (!this.seq) {
            return rect;
        } else {
            this.seq_draw.push(rect);
            return this;
        }
    }

    // /1-2\
    // 0   3
    // \5_4/ 按照数组下标取六边形各个角的坐标，this.x this.y对应0下标的坐标
    /**
     * 获取六边形各个角的坐标
     * @param  {Number} length_of_edge 正六边形边长长度
     */
    getPolyAngleAxis(length_of_edge) {
        function transAngle(angle) {
            return angle * ((2 * Math.PI) / 360);
        }

        let cos_len = length_of_edge * Math.cos(transAngle(60)),
            sin_len = length_of_edge * Math.sin(transAngle(60));
        return [
            [this.x, this.y],
            [this.x + cos_len, this.y - sin_len],
            [this.x + cos_len + length_of_edge, this.y - sin_len],
            [this.x + cos_len + length_of_edge + cos_len, this.y],
            [this.x + cos_len + length_of_edge, this.y + sin_len],
            [this.x + cos_len, this.y + sin_len]];
    }

    /**
     * 设定线的宽度
     * @param  {Number} width   线宽度
     */
    setStrokeWidth(width) {
        this.line_width = width;
    }

    /**
     * 设定线条颜色
     * @param   {String}      stroke_color      线条颜色
     */
    setStrokeColor(stroke_color) {
        this.color = stroke_color;
    }

    /**
     * 设定填充颜色
     * @param   {String}        fill_color      填充颜色
     */
    // setFillColor(fill_color) {
    //     this.setAttribute('fill-color', fill_color);
    // }

    /**
     * 重新设定坐标
     * @param  {Number} new_x   新的横坐标
     * @param  {Number} new_y   新的纵坐标
     */
    setAxis(new_x, new_y) {
        this.x = new_x;
        this.y = new_y;
        let poly = document.createElementNS(NAMESPACE, 'path');
        poly.setAttribute('d', `M ${this.x} ${this.y}`);
        this.seq_draw.push(poly);
        return this;
    }

    /**
     * 重置当前坐标为起始坐标
     */
    resetAxis() {
        this.x = Pencil.prototype.x;
        this.y = Pencil.prototype.y;
        return this;
    }

    /**
     * 开始序列化画图
     */
    seqDraw() {
        this.seq = 1;
        this.seq_draw = [];
        return this;
    }

    /**
     * 结束序列化画图
     */
    endDraw() {
        this.seq = 0;
        let group = document.createElementNS(NAMESPACE, 'g');
        this.seq_draw.forEach(function (draw) {
            group.appendChild(draw);
        });
        return group;
    }

    /**
     * 获取当前实例pencil坐标
     */
    getCurrentAxis() {
        return [this.x, this.y];
    }
} // Class Pencil


/**
 * 节点组件类，用于构建单个组件及节点链接
 * @extends Pencil
 */
class LinkComponent extends Pencil {

    /**
     * @constructor
     * @param  {Number}         origin_x        设定起始横坐标
     * @param  {Number}         origin_y        设定起始纵坐标
     * @param  {Object}         stylish         风格设定
     * @param  {Number}         status          状态标示，0是未完成，1是正在做，2是已完成
     * @param  {String}         name            名字
     * @param  {HTMLElement}    area            需要实例化的svg容器
     * @param  {Number}         area_width      svg容器宽度
     */
    constructor(origin_x, origin_y, stylish,
                status = 0,
                name = "",
                area = document.getElementById('playground'),
                area_width = 1000) {
        let x = origin_x || 80;
        let y = origin_y || 80;
        //let line_w = line_width || 2;
        //let stroke_c = stroke_color || 'silver';
        super(x, y, stylish.line_width, stylish.line_color);
        this.area = area;
        this.area_width = area_width;
        this.init_x = origin_x || 80;
        this.init_y = origin_y || 80;

        this.status = [RTODO, ACTIVE, IDLE][status];
        this.dom_model = "";
        this.next_dom_model = "";
        this.name = name;

        this.six_polyLen = stylish.six_polyLen || 30;
        this.sm_six_polyOffset = stylish.sm_six_polyOffset || 3;
        this.rect_width = stylish.rect_width || 200;
        this.rect_height = stylish.rect_height || 40;
        this.rect_radius = stylish.rect_radius || 5;
        this.arc_radius = stylish.arc_radius || 20;
        this.liftcycle_len = stylish.liftcycle_len || 200;
        this.text_color = stylish.text_color || "silver";
        this.line_color = stylish.line_color || "silver";
        this.fill_color = stylish.fill_color || "transparent";
        this.line_width = stylish.line_width || 2;
        this.inter_annotation_len = stylish.inter_annotation_len || 90;
    }

    /**
     * 创建生命周期阶段
     * @param  {String} content     生命周期文字描述
     * @param  {String} fill_color  填充颜色
     * @param  {String} line_color  线条颜色
     */
    drawLifeCycleTerm(content,
                      fill_color = this.fill_color,
                      line_color = this.line_color) {


        let result_dom = this.seqDraw().setAxis(this.next_lifecycle_x, this.next_lifecycle_y)
            .drawSixAnglePoly(this.six_polyLen, undefined, 2, line_color, "external-poly"); //画完外圈六边形后,x,y，更新，再用getPolyAngle取不同角的坐标
        let corner_axis = this.getPolyAngleAxis(this.six_polyLen);
        result_dom = result_dom.setAxis(corner_axis[2][0], corner_axis[2][1])
            .drawBiasLine(30, 0, 1, undefined, line_color, "decorate-line")
            .drawRightWardLine(95, undefined, line_color, "decorate-line")
            .drawCircle(5, fill_color, line_color, "decorate-circle")
            .setAxis(corner_axis[0][0] + 2 * this.sm_six_polyOffset, corner_axis[0][1])
            .drawSixAnglePoly(this.six_polyLen - 2 * this.sm_six_polyOffset, fill_color, undefined, line_color, "internal-poly")
            .setAxis(corner_axis[3][0], corner_axis[3][1])
            .drawTextAnnotation(content, 'start', 15, 10, -10, line_color).endDraw();
        this.next_lifecycle_x = corner_axis[3][0];
        this.next_lifecycle_y = corner_axis[3][1];
        return result_dom;
    }

    /**
     * 创建工作流阶段标示
     * @param  {String} content     工作流文字描述
     * @param  {String} fill_color  填充颜色
     * @param  {String} line_color  边框线条颜色
     * @param  {String} text_color  字体颜色
     */
    drawWorkFlowAnnotation(content,
                           fill_color = this.fill_color,
                           line_color = this.line_color,
                           text_color = this.text_color) {
        let result_dom = this.seqDraw().setAxis(this.next_annotation_x, this.next_annotation_y)
            .drawRectangle(this.rect_width, this.rect_height, fill_color, line_color, this.rect_radius)
            .drawTextAnnotation(content, 'middle', 15, this.rect_width / 2, this.rect_height / 2 + 5, text_color, "", false).endDraw();
        this.next_annotation_x = this.x + this.rect_width / 2;
        this.next_annotation_y = this.y + this.rect_height;
        return result_dom;
    }

    /**
     * 创建工作流节点
     * @param  {String}     content                     节点文字表述
     * @param  {String}     line_color                  节点线条颜色
     * @param  {Boolean}    to_left                     0是向右，1是向左，默认0
     * @param  {Boolean}    is_in_para_workflow         0是串行节点，1是并行节点，默认0
     * @param  {Number}     index_of_node_list          下标，标示next_par_approval_axis数组相应的坐标值
     * @param  {Boolean}    current_node_is_para        当前创建节点是否是并行节点，0是串行，1是并行，默认0
     * @param  {Number}     current_para_node_index     当前创建节点如果是并行节点，并行节点下标
     * @param  {Number}     current_para_node_num       当前工作流中节点个数
     * @param  {Number}     current_node_num            当前工作流中节点数目
     */
    drawWorkflowNode(content,
                     line_color = this.line_color,
                     to_left = false,
                     is_in_para_workflow = false,
                     index_of_node_list = 0,
                     current_node_is_para = false,
                     current_para_node_index = 0,
                     current_para_node_num = 2, current_node_num) {
        //let is_in_para_workflow = is_in_para_workflow || 0;
        //let to_left = to_left || 0; //默认向右

        let next_x, next_y;
        let result_dom;
        let should_ellipise = current_node_num >= 8;
        if (!is_in_para_workflow) { //如果当前处于串行工作流中
            next_x = this.next_approval_x;
            next_y = this.next_approval_y;
            if (!to_left) { //如果当前工作流向右
                if (!current_node_is_para) { //如果当前是串行工作流节点
                    let temp_dom = this.seqDraw().setAxis(next_x, next_y).drawBottomToRightArc(0);
                    let temp_x = this.x;
                    let temp_y = this.y;
                    result_dom = //temp_dom.drawDownwardLine(12, 1)
                        temp_dom
                            .drawCircle(5, line_color, line_color, "action-point")
                            .drawTextAnnotation(content, 'middle', 15, undefined, -10, undefined, "text-annotate", should_ellipise).setAxis(temp_x, temp_y)
                            .drawLeftToBottomArc(0).endDraw();
                } else { //如果如果当前是并行工作流节点
                    let current_x = this.inner_par_approval_axis[current_para_node_index].x;
                    let current_y = this.inner_par_approval_axis[current_para_node_index].y;
                    let temp_dom = this.seqDraw().setAxis(current_x, current_y).drawBottomToRightArc(0);
                    let temp_x = this.x;
                    let temp_y = this.y;
                    result_dom = //temp_dom.drawDownwardLine(12, 1)
                        temp_dom
                            .drawCircle(5, line_color, line_color, "action-point")
                            .drawTextAnnotation(content, 'middle', 15, undefined, -10, undefined, "text-annotate", should_ellipise).setAxis(temp_x, temp_y)
                            .drawLeftToBottomArc(0).endDraw();
                    this.inner_par_approval_axis[current_para_node_index].x = this.x;
                    this.inner_par_approval_axis[current_para_node_index].y = this.y;
                }
            } else { //如果当前工作流向左
                if (!current_node_is_para) {  //如果当前是串行工作流节点
                    let temp_dom = this.seqDraw().setAxis(next_x, next_y).drawRightToUpArc(0, 1);
                    let temp_x = this.x;
                    let temp_y = this.y;
                    result_dom = //temp_dom.drawDownwardLine(12, 1)
                        temp_dom
                            .drawCircle(5, line_color, line_color, "action-point")
                            .drawTextAnnotation(content, 'middle', 15, undefined, -10, undefined, "text-annotate", should_ellipise).setAxis(temp_x, temp_y)
                            .drawUpToLeftArc(0, 1).endDraw();
                } else {   // 如果当时是并行工作流节点
                    let current_x = this.inner_par_approval_axis[current_para_node_index].x;
                    let current_y = this.inner_par_approval_axis[current_para_node_index].y;
                    let temp_dom = this.seqDraw().setAxis(current_x, current_y).drawRightToUpArc(0, 1);
                    let temp_x = this.x;
                    let temp_y = this.y;
                    result_dom = //temp_dom.drawDownwardLine(12, 1)
                        temp_dom
                            .drawCircle(5, line_color, line_color, "action-point")
                            .drawTextAnnotation(content, 'middle', 15, undefined, -10, undefined, "text-annotate", should_ellipise).setAxis(temp_x, temp_y)
                            .drawUpToLeftArc(0, 1).endDraw();
                    this.inner_par_approval_axis[current_para_node_index].x = this.x;
                    this.inner_par_approval_axis[current_para_node_index].y = this.y;
                }
            }
            this.next_approval_x = this.x;
            this.next_approval_y = this.y;
        } else { //如果当前处于并行工作流中
            // console.log(index_of_node_list,this.next_par_approval_axis);
            let par_next_x = this.next_par_approval_axis[index_of_node_list].x;
            let par_next_y = this.next_par_approval_axis[index_of_node_list].y;
            let self = this;
            if (!to_left) { //如果当前工作流向右
                if (!current_node_is_para) {  //如果当前工作流节点是串行
                    //this.next_par_approval_axis.forEach(function (axis) {
                    let temp_dom = self.seqDraw().setAxis(par_next_x, par_next_y).drawBottomToRightArc(0);
                    let temp_x = self.x;
                    let temp_y = self.y;
                    result_dom = //temp_dom.drawDownwardLine(12, 1)
                        temp_dom
                            .drawCircle(5, line_color, line_color, "action-point")
                            .drawTextAnnotation(content, 'middle', 15, undefined, -10, undefined, "text-annotate", should_ellipise).setAxis(temp_x, temp_y)
                            .drawLeftToBottomArc(0).endDraw();
                    //});
                } else {    //如果当前工作流节点是并行
                    let current_x = this.inner_par_approval_axis[current_para_node_index].x;
                    let current_y = this.inner_par_approval_axis[current_para_node_index].y;
                    let temp_dom = this.seqDraw().setAxis(current_x, current_y).drawBottomToRightArc(0);
                    let temp_x = this.x;
                    let temp_y = this.y;
                    result_dom = //temp_dom.drawDownwardLine(12, 1)
                        temp_dom
                            .drawCircle(5, line_color, line_color, "action-point")
                            .drawTextAnnotation(content, 'middle', 15, undefined, -10, undefined, "text-annotate", should_ellipise).setAxis(temp_x, temp_y)
                            .drawLeftToBottomArc(0).endDraw();
                    this.inner_par_approval_axis[current_para_node_index].x = this.x;
                    this.inner_par_approval_axis[current_para_node_index].y = this.y;
                }
            } else { //如果当前工作流向左
                if (!current_node_is_para) {  //如果当前工作流节点是串行
                    let temp_dom = self.seqDraw().setAxis(par_next_x, par_next_y).drawRightToUpArc(0, 1);
                    let temp_x = self.x;
                    let temp_y = self.y;
                    result_dom = //temp_dom.drawDownwardLine(12, 1)
                        temp_dom
                            .drawCircle(5, line_color, line_color, "action-point")
                            .drawTextAnnotation(content, 'middle', 15, undefined, -10, undefined, "text-annotate", should_ellipise).setAxis(temp_x, temp_y)
                            .drawUpToLeftArc(0, 1).endDraw();
                } else {    //如果当前工作流节点是并行
                    let current_x = this.inner_par_approval_axis[current_para_node_index].x;
                    let current_y = this.inner_par_approval_axis[current_para_node_index].y;
                    let temp_dom = self.seqDraw().setAxis(current_x, current_y).drawRightToUpArc(0, 1);
                    let temp_x = self.x;
                    let temp_y = self.y;
                    result_dom = //temp_dom.drawDownwardLine(12, 1)
                        temp_dom
                            .drawCircle(5, line_color, line_color, "action-point")
                            .drawTextAnnotation(content, 'middle', 15, undefined, -10, undefined, "text-annotate", should_ellipise).setAxis(temp_x, temp_y)
                            .drawUpToLeftArc(0, 1).endDraw();
                    this.inner_par_approval_axis[current_para_node_index].x = this.x;
                    this.inner_par_approval_axis[current_para_node_index].y = this.y;

                }
            }
            this.next_par_approval_axis[index_of_node_list] = {x: this.x, y: this.y};
        }
        return result_dom;
    }

    /**
     * 创建工作流内节点连接线
     * @param  {Number}     length_of_connection        连接长度
     * @param  {Boolean}    to_left                     0是向左，1是向右，默认0
     * @param  {Boolean}    is_in_para_workflow         0是串行，1是并行，默认0
     * @param  {Number}     index_of_para_workflow      下标标示在第几个工作流
     * @param  {Boolean}    next_node_is_para           标示下一个节点是否是并行节点
     * @param  {Number}     next_para_node_num          标示下一个如果是并行节点是几个并行
     * @param  {Boolean}    current_node_is_para        当前创建节点是否是并行节点，默认是创兴节点
     * @param  {Number}     current_para_node_index     当前创建的并行节点下标
     * @param  {Number}     current_para_node_num       当前创建的并行节点的并行个数，默认2个
     */
    drawInnerWorkflowNodeConnection(length_of_connection,
                                    to_left = false,
                                    is_in_para_workflow = false, index_of_para_workflow,
                                    next_node_is_para = false,
                                    next_para_node_num = 2,
                                    current_node_is_para = false, current_para_node_index, current_para_node_num) {

        let result_dom;
        let inner_para_line_len = 2 * this.arc_radius;
        //置空，以提供同一个工作流下多组并行节点
        if (!current_node_is_para && next_node_is_para) {
            this.inner_par_approval_axis = [];
        }
        if (!to_left) { //如果当前图画向右
            //if (!is_in_para_workflow) { //如果处于串行工作流中
            let start_x, start_y;
            if (!is_in_para_workflow) {
                start_x = this.next_approval_x;
                start_y = this.next_approval_y;
            } else {
                start_x = this.next_par_approval_axis[index_of_para_workflow].x;
                start_y = this.next_par_approval_axis[index_of_para_workflow].y;
            }
            if (!next_node_is_para) { //如果下一个节点是串行
                if (!current_node_is_para) {  //如果当前节点是串行节点
                    result_dom = this.seqDraw().setAxis(start_x, start_y)
                        .drawLeftToBottomArc(this.arc_radius)
                        .drawRightWardLine(length_of_connection)
                        .drawBottomToRightArc(this.arc_radius).endDraw();
                } else {    //如果当前节点是并行节点
                    let temp_drawer = this.seqDraw().setAxis(start_x, start_y);
                    let isOdd = current_para_node_num % 2 !== 0;
                    if (isOdd) { //如果是奇数个并行节点数目
                        if (current_para_node_index < parseInt(current_para_node_num / 2)) { //如果当前节点在水平线以上
                            temp_drawer.drawLeftToBottomArc(this.arc_radius)
                                .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2)
                                .drawLeftToBottomArc(this.arc_radius, 1)
                                .drawDownwardLine(parseInt(current_para_node_num / 2 - current_para_node_index - 1) * inner_para_line_len)
                                .drawLeftToBottomArc(this.arc_radius)
                                .drawRightWardLine(length_of_connection / 2 - this.arc_radius)
                                .drawBottomToRightArc(this.arc_radius);
                        } else if (current_para_node_index === parseInt(current_para_node_num / 2)) {        //如果当前节点在水平线之间
                            temp_drawer.drawLeftToBottomArc(this.arc_radius).drawRightWardLine(length_of_connection).drawBottomToRightArc(this.arc_radius);

                        } else {    //如果在水平线之下
                            temp_drawer.drawLeftToBottomArc(this.arc_radius)
                                .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2).drawBottomToRightArc(this.arc_radius)
                                .drawDownwardLine(parseInt(current_para_node_index - current_para_node_num / 2) * inner_para_line_len, 1)
                                .drawBottomToRightArc(this.arc_radius, 1)
                                .drawRightWardLine(length_of_connection / 2 - this.arc_radius)
                                .drawBottomToRightArc(this.arc_radius);
                        }
                    } else {
                        // 如果是偶数个并行节点数目
                        if (current_para_node_index < (current_para_node_num / 2)) { //如果当前节点在水平线以上
                            temp_drawer.drawLeftToBottomArc(this.arc_radius)
                                .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2).drawLeftToBottomArc(this.arc_radius, 1)
                                .drawDownwardLine((current_para_node_num / 2 - current_para_node_index - 1) * inner_para_line_len)
                                .drawLeftToBottomArc(this.arc_radius)
                                .drawRightWardLine(length_of_connection / 2 - this.arc_radius)
                                .drawBottomToRightArc(this.arc_radius);
                        } else {    //如果在水平线之下
                            temp_drawer.drawLeftToBottomArc(this.arc_radius)
                                .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2).drawBottomToRightArc(this.arc_radius)
                                .drawDownwardLine((current_para_node_index - current_para_node_num / 2) * inner_para_line_len, 1)
                                .drawBottomToRightArc(this.arc_radius, 1)
                                .drawRightWardLine(length_of_connection / 2 - this.arc_radius)
                                .drawBottomToRightArc(this.arc_radius);
                        }

                    }

                    result_dom = temp_drawer.endDraw();
                }
                if (!is_in_para_workflow) {
                    this.next_approval_x = this.x;
                    this.next_approval_y = this.y;
                } else {
                    this.next_par_approval_axis[index_of_para_workflow] = {x: this.x, y: this.y};
                }
            } else { //如果下一节点是并行节点
                if (!current_node_is_para) {  //如果当前是串行节点
                    let middle_line = this.seqDraw().setAxis(this.next_approval_x, this.next_approval_y)
                        .drawLeftToBottomArc(this.arc_radius)
                        .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2);
                    let [middle_x, middle_y] = [middle_line.x, middle_line.y];
                    let isOdd = next_para_node_num % 2 !== 0;
                    for (let i = 1; i <= Math.ceil(next_para_node_num / 2); i++) {
                        if (isOdd && i === 1) { //如果是奇数而且是第一个，则直接往下划线即可
                            middle_line = middle_line.setAxis(middle_x, middle_y).drawRightWardLine((length_of_connection + 2 * this.arc_radius) / 2)
                                .drawBottomToRightArc(this.arc_radius);
                            this.inner_par_approval_axis.push({x: this.x, y: this.y});
                            continue;
                        }
                        middle_line = middle_line.setAxis(middle_x, middle_y).drawBottomToRightArc(this.arc_radius);
                        if (isOdd) middle_line.drawDownwardLine((i - 2) * inner_para_line_len, 1);
                        else middle_line.drawDownwardLine((i - 1) * inner_para_line_len, 1);
                        //.drawDownwardLine((i-1) * this.arc_radius, 1)
                        middle_line.drawBottomToRightArc(this.arc_radius, 1)
                            .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2)
                            .drawBottomToRightArc(this.arc_radius);
                        this.inner_par_approval_axis.unshift({x: this.x, y: this.y});
                        middle_line = middle_line.setAxis(middle_x, middle_y).drawLeftToBottomArc(this.arc_radius, 1);
                        if (isOdd) middle_line.drawDownwardLine((i - 2) * 2 * this.arc_radius);
                        else middle_line.drawDownwardLine((i - 1) * inner_para_line_len);
                        //.drawDownwardLine((i-1) * this.arc_radius)
                        middle_line.drawLeftToBottomArc(this.arc_radius)
                            .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2)
                            .drawBottomToRightArc(this.arc_radius);
                        this.inner_par_approval_axis.push({x: this.x, y: this.y});
                    }
                    result_dom = middle_line.endDraw();
                } else {        //如果当前是并行节点
                    // TODO 当前是并行节点，下一个不会是并行节点
                }

            }
        } else { //如果当前图画向左
            //if(!is_in_para_workflow) { //如果处于串行工作流之中
            let start_x, start_y;
            if (!is_in_para_workflow) {
                start_x = this.next_approval_x;
                start_y = this.next_approval_y;
            } else {
                start_x = this.next_par_approval_axis[index_of_para_workflow].x;
                start_y = this.next_par_approval_axis[index_of_para_workflow].y;
            }
            if (!next_node_is_para) { //如果下一个节点是串行
                if (!current_node_is_para) {  //如果当前是串行节点
                    result_dom = this.seqDraw().setAxis(start_x, start_y)
                        .drawUpToLeftArc(this.arc_radius, 1)
                        .drawRightWardLine(length_of_connection, 1)
                        .drawRightToUpArc(this.arc_radius, 1).endDraw();
                    // this.next_approval_x = this.x;
                    // this.next_approval_y = this.y;
                } else {    //如果当前是并行节点
                    // let start_x = this.inner_par_approval_axis[current_para_node_index].x;
                    // let start_y = this.inner_par_approval_axis[current_para_node_index].y;
                    let temp_drawer = this.seqDraw().setAxis(start_x, start_y);
                    let isOdd = current_para_node_num % 2 !== 0;
                    if (isOdd) { //如果是奇数个并行节点数目
                        if (current_para_node_index < parseInt(current_para_node_num / 2)) { //如果当前节点在水平线以上
                            temp_drawer.drawUpToLeftArc(this.arc_radius, 1)
                                .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2, 1)
                                .drawUpToLeftArc(this.arc_radius)
                                .drawDownwardLine(parseInt(current_para_node_num / 2 - current_para_node_index - 1) * inner_para_line_len)
                                .drawUpToLeftArc(this.arc_radius, 1)
                                .drawRightWardLine(length_of_connection / 2 - this.arc_radius, 1)
                                .drawRightToUpArc(this.arc_radius, 1)
                        } else if (current_para_node_index === parseInt(current_para_node_num / 2)) {        //如果当前节点在水平线之间
                            temp_drawer.drawUpToLeftArc(this.arc_radius, 1).drawRightWardLine(length_of_connection, 1);

                        } else {    //如果在水平线之下
                            temp_drawer.drawUpToLeftArc(this.arc_radius, 1)
                                .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2, 1)
                                .drawRightToUpArc(this.arc_radius, 1)
                                .drawDownwardLine(parseInt(current_para_node_index - current_para_node_num / 2) * inner_para_line_len, 1)
                                .drawRightToUpArc(this.arc_radius)
                                .drawRightWardLine(length_of_connection / 2 - this.arc_radius, 1)
                                .drawRightToUpArc(this.arc_radius, 1);
                        }
                    } else {
                        // TODO 如果是偶数个并行节点数目
                        if (current_para_node_index < (current_para_node_num / 2)) { //如果当前节点在水平线以上
                            temp_drawer.drawUpToLeftArc(this.arc_radius, 1)
                                .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2, 1)
                                .drawUpToLeftArc(this.arc_radius)
                                .drawDownwardLine((current_para_node_num / 2 - current_para_node_index - 1) * inner_para_line_len)
                                .drawUpToLeftArc(this.arc_radius, 1)
                                .drawRightWardLine(length_of_connection / 2 - this.arc_radius, 1)
                                .drawRightToUpArc(this.arc_radius, 1);
                        } else {    //如果在水平线之下
                            temp_drawer.drawUpToLeftArc(this.arc_radius, 1)
                                .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2, 1)
                                .drawRightToUpArc(this.arc_radius, 1)
                                .drawDownwardLine((current_para_node_index - current_para_node_num / 2) * inner_para_line_len, 1)
                                .drawRightToUpArc(this.arc_radius)
                                .drawRightWardLine(length_of_connection / 2 - this.arc_radius, 1)
                                .drawRightToUpArc(this.arc_radius, 1);
                        }
                        // this.next_approval_x = this.x;
                        // this.next_approval_y = this.y;
                        //result_dom = temp_drawer.endDraw();
                    }

                    // this.next_approval_x = this.x;
                    // this.next_approval_y = this.y;
                    result_dom = temp_drawer.endDraw();

                }
                if (!is_in_para_workflow) {
                    this.next_approval_x = this.x;
                    this.next_approval_y = this.y;
                } else {
                    this.next_par_approval_axis[index_of_para_workflow] = {x: this.x, y: this.y};
                }
            } else {    //如果下一个节点是并行
                // let next_x = this.next_par_approval_axis[index_of_para_workflow].x,
                //     next_y = this.next_par_approval_axis[index_of_para_workflow].y;
                if (!current_node_is_para) {  // 如果当前节点是串行节点
                    let middle_line = this.seqDraw().setAxis(start_x, start_y)
                        .drawUpToLeftArc(this.arc_radius, 1)
                        .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2, 1);
                    let [middle_x, middle_y] = [middle_line.x, middle_line.y];
                    let isOdd = next_para_node_num % 2 !== 0;
                    for (let i = 1; i <= Math.ceil(next_para_node_num / 2); i++) {
                        if (isOdd && i === 1) { //如果是奇数而且是第一个，则直接往下划线即可
                            middle_line = middle_line.setAxis(middle_x, middle_y)
                                .drawRightWardLine((length_of_connection + 2 * this.arc_radius) / 2, 1)
                                .drawRightToUpArc(this.arc_radius, 1);
                            this.inner_par_approval_axis.push({x: this.x, y: this.y});
                            continue;
                        }
                        middle_line.setAxis(middle_x, middle_y).drawRightToUpArc(this.arc_radius, 1);
                        if (isOdd) middle_line.drawDownwardLine((i - 2) * inner_para_line_len, 1);
                        else middle_line.drawDownwardLine((i - 1) * inner_para_line_len, 1);
                        middle_line.drawRightToUpArc(this.arc_radius)
                            .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2, 1)
                            .drawRightToUpArc(this.arc_radius, 1);
                        this.inner_par_approval_axis.unshift({x: this.x, y: this.y});
                        middle_line.setAxis(middle_x, middle_y).drawUpToLeftArc(this.arc_radius);
                        if (isOdd) middle_line.drawDownwardLine((i - 2) * inner_para_line_len);
                        else middle_line.drawDownwardLine((i - 1) * inner_para_line_len);
                        middle_line.drawUpToLeftArc(this.arc_radius, 1)
                            .drawRightWardLine((length_of_connection - 2 * this.arc_radius) / 2, 1)
                            .drawRightToUpArc(this.arc_radius, 1);
                        this.inner_par_approval_axis.push({x: this.x, y: this.y});
                    }
                    result_dom = middle_line.endDraw();
                } else {    //如果当前节点是并行节点
                    // TODO 当前是并行节点，下一个不会是并行节点
                }
            }
        }
        return result_dom;
    }

    /**
     * 创建工作流间连接线
     * @param  {Number}     to_left                     0是向右，1是向左，默认0
     * @param  {Boolean}    is_in_para_workflow         当前工作流的类型，0是串行，1是并行，默认0
     * @param  {Number}     next_para_workflow_num      下一个如果是并行工作流，有几个并行
     * @param  {Boolean}    next_workflow_is_para       下一个工作流是否是并行工作流
     * @param  {Number}     current_para_workflow_num   当前并行工作流并行数量
     * @param  {Number}     current_para_workflow_index 当前并行工作流的下标，标示是第几个并行工作流
     * @param  {Number}     max_inner_para_num          当前工作流最大并行节点个数
     */
    drawInterWorkflowNodeConnection(to_left = 0,
                                    is_in_para_workflow = false,
                                    next_para_workflow_num = 2,
                                    next_workflow_is_para = false,
                                    current_para_workflow_num = 2, current_para_workflow_index, max_inner_para_num) {
        let result_dom;

        this.setAnnotationLen(max_inner_para_num);
        if (to_left) { //如果当工作流链图画向左拐
            if (!is_in_para_workflow) { //如果当前工作流是串行
                if (!next_workflow_is_para) { //如果下一个工作流是串行
                    result_dom = this.seqDraw().setAxis(this.next_approval_x, this.next_approval_y).drawLeftToBottomArc(this.arc_radius, 1)
                        .drawDownwardLine(this.inter_annotation_len + this.rect_height - 2 * this.arc_radius)
                        .drawUpToLeftArc(this.arc_radius, 1).endDraw();
                    this.next_approval_x = this.x;
                    this.next_approval_y = this.y;
                } else { //如果下一个工作流是并行
                    let len = next_para_workflow_num;
                    let inter_connection = this.seqDraw().drawLeftToBottomArc(this.arc_radius, 1);
                    let temp_x = inter_connection.x,
                        temp_y = inter_connection.y;
                    for (let i = 0; i < len; i++) {
                        if (!i) { //如果是并行工作流的第一个节点
                            inter_connection = inter_connection.setAxis(temp_x, temp_y).drawDownwardLine(this.inter_annotation_len + this.rect_height - 2 * this.arc_radius);
                        } else {
                            inter_connection = inter_connection.setAxis(temp_x, temp_y).drawDownwardLine(this.inter_annotation_len + this.rect_height);
                        }
                        temp_x = inter_connection.x;
                        temp_y = inter_connection.y;
                        inter_connection.drawUpToLeftArc(this.arc_radius, 1);
                        this.next_par_approval_axis.push({
                            x: this.x,
                            y: this.y
                        });
                        // console.log(this.next_par_approval_axis);
                    } //for i
                    result_dom = inter_connection.endDraw();
                }
            } else { //如果当前工作流是并行
                if (!next_workflow_is_para) { //如果下一个工作流是串行
                    let len = current_para_workflow_num;
                    let inter_connection = this.seqDraw();
                    //for (let i = 0; i < len; i++) {
                    let current_x = this.next_par_approval_axis[current_para_workflow_index].x;
                    let current_y = this.next_par_approval_axis[current_para_workflow_index].y;
                    if (current_para_workflow_index < current_para_workflow_num - 1) { //如果是并行工作流的非最后工作流
                        inter_connection = inter_connection.setAxis(current_x, current_y).drawLeftToBottomArc(this.arc_radius, 1)
                            .drawDownwardLine(len * this.inter_annotation_len + len * this.rect_height - 2 * this.arc_radius)
                            .drawUpToLeftArc(this.arc_radius, 1);

                        //if(current_para_workflow_index==0) {
                        this.next_approval_x = this.x;
                        this.next_approval_y = this.y;
                        //}
                    } else { //如果是最后一个工作流
                        inter_connection = inter_connection.setAxis(current_x, current_y).drawLeftToBottomArc(this.arc_radius, 1);
                    }
                    //} //for i
                    result_dom = inter_connection.endDraw();
                } else { //如果下一个工作流是并行
                    let len = current_para_workflow_num;
                    let inter_connection = this.seqDraw();
                    //for (let i = 0; i < len; i++) {
                    let current_x = this.next_par_approval_axis[current_para_workflow_index].x;
                    let current_y = this.next_par_approval_axis[current_para_workflow_index].y;

                    inter_connection = inter_connection.setAxis(current_x, current_y).drawLeftToBottomArc(this.arc_radius, 1)
                        .drawDownwardLine(len * this.inter_annotation_len + len * this.rect_height - 2 * this.arc_radius)
                        .drawUpToLeftArc(this.arc_radius, 1);
                    this.next_par_approval_axis[current_para_workflow_index] = {x: this.x, y: this.y};
                    //} //for i
                    result_dom = inter_connection.endDraw();
                }

            } //if else !is_in_para_workflow
        } else { //如果当前图画向右拐
            if (!is_in_para_workflow) { //如果当前是串行
                if (!next_workflow_is_para) { //如果下一个工作流是串行
                    result_dom = this.seqDraw().setAxis(this.next_approval_x, this.next_approval_y).drawUpToLeftArc(this.arc_radius)
                        .drawDownwardLine(this.inter_annotation_len + this.rect_height - 2 * this.arc_radius)
                        .drawLeftToBottomArc(this.arc_radius).endDraw();
                    this.next_approval_x = this.x;
                    this.next_approval_y = this.y;
                } else { //如果下一个工作流是并行
                    let len = next_para_workflow_num;
                    let inter_connection = this.seqDraw().drawUpToLeftArc(this.arc_radius);
                    let temp_x = inter_connection.x,
                        temp_y = inter_connection.y;
                    for (let i = 0; i < len; i++) {
                        if (!i) { //如果是并行工作流的第一个节点
                            inter_connection = inter_connection.setAxis(temp_x, temp_y).drawDownwardLine(this.inter_annotation_len + this.rect_height - 2 * this.arc_radius);
                        } else {
                            inter_connection = inter_connection.setAxis(temp_x, temp_y).drawDownwardLine(this.inter_annotation_len + this.rect_height);
                        }
                        temp_x = inter_connection.x;
                        temp_y = inter_connection.y;
                        inter_connection.drawLeftToBottomArc(this.arc_radius);
                        this.next_par_approval_axis.push({
                            x: this.x,
                            y: this.y
                        });
                        // console.log(this.next_par_approval_axis);
                    } //for i
                    result_dom = inter_connection.endDraw();
                }
            } else { //如果当前工作流是并行
                if (!next_workflow_is_para) { //如果下一个工作流是串行
                    let len = current_para_workflow_num;
                    let inter_connection = this.seqDraw();
                    //for (let i = 0; i < len; i++) {
                    let current_x = this.next_par_approval_axis[current_para_workflow_index].x;
                    let current_y = this.next_par_approval_axis[current_para_workflow_index].y;
                    //
                    // 这段代码从并行工作流画到串行工作流的方法不一样，被注释的这段代码是直接从并行工作流的第一个工作流划到
                    // 下一个串行工作流的起始节点，但是有问题，因为不能确定每个并行工作流之间的间隔，画的线可能太短导致串行工作流
                    // 中的内并行节点会遮挡并行节点
                    //
                    /**
                     * @deprecated
                     if (current_para_workflow_index < current_para_workflow_num-1) { //如果是非工作流组最后一个工作流
                                if (current_para_workflow_index === 0) {
                                    inter_connection = inter_connection.setAxis(current_x, current_y).drawUpToLeftArc(this.arc_radius)
                                        .drawDownwardLine(len * this.inter_annotation_len + len * this.rect_height - 2 * this.arc_radius)
                                        .drawLeftToBottomArc(this.arc_radius);
                                    this.next_approval_x = inter_connection.x;
                                    this.next_approval_y = inter_connection.y;
                                } else {
                                    //     //if(i!=current_para_workflow_num-1) {
                                    inter_connection = inter_connection.setAxis(current_x, current_y).drawUpToLeftArc(this.arc_radius);
                                }**/

                    // 这段代码就是一个一个往下画，这样保证每个节点往下画的长度与工作流方框间隔是相同的（已做根据工作流
                    // 中内并行数量来自适应间隔高度），在最后一个并行工作流里再设置下一个串行工作流的起始节点
                    //
                    if (current_para_workflow_index !== current_para_workflow_num - 1) {
                        inter_connection = inter_connection.setAxis(current_x, current_y).drawUpToLeftArc(this.arc_radius)
                            .drawDownwardLine(this.inter_annotation_len + this.rect_height);
                    } else {
                        inter_connection = inter_connection.setAxis(current_x, current_y).drawUpToLeftArc(this.arc_radius)
                            .drawDownwardLine(this.inter_annotation_len)
                            .drawLeftToBottomArc(this.arc_radius);
                        // 设置下一个工作流的起始节点
                        this.next_approval_x = inter_connection.x;
                        this.next_approval_y = inter_connection.y;
                    }
                    // }
                    //} //for i
                    result_dom = inter_connection.endDraw();
                } else { //如果下一个工作流是并行
                    let len = current_para_workflow_num;
                    let inter_connection = this.seqDraw();
                    //for (let i = 0; i < len; i++) {
                    let current_x = this.next_par_approval_axis[current_para_workflow_index].x;
                    let current_y = this.next_par_approval_axis[current_para_workflow_index].y;

                    inter_connection = inter_connection.setAxis(current_x, current_y).drawUpToLeftArc(this.arc_radius)
                        .drawDownwardLine(len * this.inter_annotation_len + len * this.rect_height - 2 * this.arc_radius)
                        .drawLeftToBottomArc(this.arc_radius);
                    this.next_par_approval_axis[current_para_workflow_index] = {x: this.x, y: this.y};
                    //} //for i
                    result_dom = inter_connection.endDraw();
                }

            } //if else !is_in_para_workflow
        }
        return result_dom;
    }

    /**
     * 创建生命周期节点间连线
     * @param  {Number} length_of_connection 连线长度
     */
    drawInterLifeCycleConnection(length_of_connection = this.liftcycle_len) {
        let result_dom = this.seqDraw().drawRightWardLine(length_of_connection, 0, 'silver').endDraw();
        this.next_lifecycle_x = this.x;
        this.next_lifecycle_y = this.y;
        return result_dom;
    }

    /**
     * 创建生命周期和工作流框之间的连线
     * @param  {Number} index_of_lifecycle          生命周期下标，标示第几个生命周期
     * @param  {Number} length_of_connection        生命周期间连线长度，默认在父类stylish定义
     */
    drawConnectionBetweenLifecycleAndAnnotation(index_of_lifecycle,
                                                length_of_connection = this.liftcycle_len,
                                                line_color = this.line_color) {
        let result_dom;
        //console.log('indexOflc',index_of_lifecycle);
        if (index_of_lifecycle === 0) { //如果是index为0的生命周期阶段，则直接往下画直线
            result_dom = this.seqDraw().setAxis(this.next_annotation_x, this.next_annotation_y)
                .drawDownwardLine(this.inter_annotation_len).endDraw();
        } else { //如果index不为0.则需要曲线拐过去
            result_dom = this.seqDraw().setAxis(this.next_annotation_x, this.next_annotation_y)
                .drawUpToLeftArc(this.arc_radius, 1)
                .drawRightWardLine(2 * (index_of_lifecycle) * this.six_polyLen + index_of_lifecycle * length_of_connection - 2 * this.arc_radius, 1)
                .drawUpToLeftArc(this.arc_radius)
                .drawDownwardLine(this.inter_annotation_len - 2 * this.arc_radius).endDraw();
        }
        this.next_annotation_x = this.x - this.rect_width / 2;
        this.next_annotation_y = this.y;
        return result_dom;
    }

    /**
     *创建工作流框间的连接线
     */
    drawInterAnnotationConnection(annotation_len = this.inter_annotation_len) {
        let result_dom = this.seqDraw().setAxis(this.next_annotation_x, this.next_annotation_y).drawDownwardLine(annotation_len).endDraw();
        this.next_annotation_x = this.x - this.rect_width / 2;
        this.next_annotation_y = this.y;
        WorkflowChain.prototype.inter_annotation_len = this.inter_annotation_len;
        return result_dom;
    }

    /**
     *渲染函数，停止seqDraw()
     */
    render() {
        return this.endDraw();
    }

    /**
     *创建结束节点
     */
    drawEndingNode() {
        let frag = document.createDocumentFragment();
        if (this.next_dom_model) frag.appendChild(this.next_dom_model);
        if (this.dom_model.lastChild) frag.appendChild(this.dom_model.lastChild);
        frag = null;
    }

    /**
     * 重设工作流方框连接线的长度
     * @param {Number} num  当前工作流中最大并行节点个数
     * @param {Number} len  直接设置相应的长度
     */
    setAnnotationLen(num, len) {
        if (!len) {
            this.inter_annotation_len = num / 2 * 4 * this.arc_radius;
        } else {
            this.inter_annotation_len = len;
        }
        LinkComponent.prototype.inter_annotation_len = this.inter_annotation_len;
    }

    /**
     * ==============================================================================================================================================
     * 交互事件
     */
    /**
     * 设置省略节点悬浮提示效果
     */
    setHoverEffect() {
        let self = this;
        let tipWrapper;
        this.dom_model.addEventListener('mouseover', function (event) {
            // console.log(self.name, event, event.clientX, event.clientY);
            if (event.target.nodeName === "text") {
                let div = document.createElement('span');
                let x = event.target.getBBox().x;
                let y = event.target.getBBox().y;
                //套一个foreignObject,否则svg视图里不能显示div等非svg标签
                tipWrapper = document.createElementNS(NAMESPACE, 'foreignObject');
                div.setAttribute("style", `z-index:9999;white-space:nowrap;float:left; padding:5px;box-shadow: 0 0 10px #ccc;background: #fff !important;border-radius: 6px;background-color:white;position:fixed;top:${y - 40}px;left:${x}px`);
                tipWrapper.appendChild(div);
                self.area.appendChild(tipWrapper);
                div.innerHTML = self.name;
            }
            // $(tipWrapper).fadeIn(1000);
        });
        this.dom_model.addEventListener('mouseout', function (event) {
            //self.area.removeChild(tipWrapper);
            let trash_dom = document.createDocumentFragment();
            trash_dom.appendChild(tipWrapper);
            trash_dom = null;
        });
    }

    setClickEffect(react_info) {}

    setDropdownEffect() {}

} // Class LinkComponent


/**
 * 生命周期类 继承节点类
 * @extends LinkComponent
 */
class LifecycleLink extends LinkComponent {
    /**
     * @constructor
     * @param  {Number} origin_x            初始化的横坐标
     * @param  {Number} origin_y            初始化的纵坐标
     * @param  {Object} stylish             stylish标示
     * @param  {Number} num_of_lifecycle    生命周期个数
     * @param  {String} name                生命周期名称
     * @param  {Object} id_bundle           id集合
     */
    constructor(origin_x, origin_y, stylish, num_of_lifecycle, name, id_bundle) {
        super(origin_x, origin_y, stylish, id_bundle.dataStatus, name);
        //数据
        this.workflow = [];
        this.workflowIds = id_bundle.workflowIds;
        this.name = name;
        //this.status = IDLE;
        this.connect_len = 800 / num_of_lifecycle; //生命周期间连线长度
        this.processInstanceId = id_bundle.processInstanceId || "";
        this.lifeCyclePeriodId = id_bundle.lifeCyclePeriodId || "";
        this.periodRecordId = id_bundle.periodRecordId || "";
        //this.status = [IDLE,ACTIVE,RTODO][id_bundle.periodState];
        // this.status = [IDLE, ACTIVE, RTODO][id_bundle.dataStatus];
        //dom节点

        this.connect_workflow_dom = "";
        //父级生命周期
        this.parent_lifecycle = "";

        //当前坐标
        //console.log(LifecycleLink.prototype.next_lifecycle_x,LifecycleLink.prototype.next_lifecycle_y);
        this.next_lifecycle_x = LifecycleLink.prototype.next_x || origin_x;
        this.next_lifecycle_y = LifecycleLink.prototype.next_y || origin_y;

        this.connect_to_annotation_x = (this.setAxis(this.next_lifecycle_x, this.next_lifecycle_y)
            .getPolyAngleAxis(this.six_polyLen))[5][0] + (this.six_polyLen / 2);
        this.connect_to_annotation_y = (this.setAxis(this.next_lifecycle_x, this.next_lifecycle_y)
            .getPolyAngleAxis(this.six_polyLen))[5][1];

        //console.log(this.connect_to_annotation_x,this.connect_to_annotation_y);
    }

    /**
     */
    createNode() {
        this.dom_model = this.drawLifeCycleTerm(this.name);
        this.next_dom_model = this.drawInterLifeCycleConnection(this.connect_len);

        LifecycleLink.prototype.next_x = this.next_lifecycle_x;
        LifecycleLink.prototype.next_y = this.next_lifecycle_y;
        this.area.appendChild(this.dom_model);
        this.area.appendChild(this.next_dom_model);
        this.setStatus(this.status);
    }

    registerEvent() {
        let self = this;
        self.dom_model.addEventListener('click', this.EventHandlers.lifecycleClick);
    }

    drawEndingNode() {
        let frag = document.createDocumentFragment();
        frag.appendChild(this.next_dom_model);
    }

    /**
     * 设置生命周期状态 ,idle或者active
     * @param  {Symbol} status      生命周期状态
     * @param  {Boolean} not_colored    是否染色，默认染色
     */
    setStatus(status, not_colored = false) {
        if (status === ACTIVE) {
            if (!not_colored) {
                this.dom_model.setAttribute('stroke', 'red');
                Array.prototype.forEach.call(this.dom_model.childNodes, function (dom) {
                    dom.setAttribute('stroke', 'red');
                });
                this.dom_model.querySelector('.decorate-circle').setAttribute('fill', 'red'); //将装饰圆点填充红色
                this.dom_model.querySelector('.internal-poly').setAttribute('fill', 'red');//将内六边形填充红色

            }
            this.status = ACTIVE;

        } else if (status === IDLE) {
            if (!not_colored) {
                this.dom_model.setAttribute('stroke', 'black');
                Array.prototype.forEach.call(this.dom_model.childNodes, function (dom) {
                    dom.setAttribute('stroke', 'black');
                });
                this.dom_model.querySelector('.decorate-circle').setAttribute('fill', 'black');
                this.dom_model.querySelector('.internal-poly').setAttribute('fill', 'black');
            }
            this.status = IDLE;
        } else if (status === RTODO) {
            if (!not_colored) {
                this.dom_model.setAttribute('stroke', 'silver');
                Array.prototype.forEach.call(this.dom_model.childNodes, function (dom) {
                    dom.setAttribute('stroke', 'silver');
                });
                this.dom_model.querySelector('.decorate-circle').setAttribute('fill', 'silver');
                this.dom_model.querySelector('.internal-poly').setAttribute('fill', 'silver');
            }
            this.status = RTODO;
        } else if (status === HIDDEN) {
            // this.displayWorkflows(true);//隐藏工作流节点
            // this.setStatus(IDLE,not_colored);
            // 因为不用数组去存已经获取的生命周期了，每次点击生命周期都要进行请求，所以切换生命周期阶段的时候应该把上个阶段的删除
            this.destroy();
        }
    }

    destroy(option = false) {
        this.workflow.forEach(function (flow) {
            flow.destroy(true);
        });
        if (option) {
            this.dom_model.removeThisNode();
        }
    }

    /**
     * 挂载工作流实例
     * @param  {WorkflowChain} new_workflow     工作流实例
     */
    mountWorkflow(new_workflow) {
        this.workflow.push(new_workflow);
        new_workflow.parent_lifecycleterm = this;
    }

    /**
     * 是否显示工作流
     * @param  {Boolean} flag       0是显示，1是隐藏，默认0
     */
    displayWorkflows(flag = false) {
        if (!flag) { //默认显示
            this.workflow.forEach(function (flow) {
                flow.displaySelf();
            });

        } else {//如果不显示
            this.workflow.forEach(function (flow) {
                flow.displaySelf(true);//
            });
        }
    }

    /**
     */
    static refreshPrototypeVar() {
        delete LifecycleLink.prototype.next_x;
        delete LifecycleLink.prototype.next_y;
    }
} //Class LifeCycleModel

/**
 * 工作流类，继承节点类
 * @extends LinkComponent
 */
class WorkflowChain extends LinkComponent {
    /**
     * @constructor
     * @param  {Number} origin_x        初始化横坐标
     * @param  {Number} origin_y        初始化纵坐标
     * @param  {Object} stylish         stylish对象
     * @param  {String} name            工作流名字
     * @param  {String} id              工作流id
     * @param  {String} status          工作流状态
     * @param  {Number} run_type        工作流串并行类型
     */
    constructor(origin_x, origin_y, stylish, name, id, status, run_type) {
        super(origin_x, origin_y, stylish, status, name);
        //数据
        this.action = [];
        this.formatted_action = [];
        this.id = id || "";
        //this.status = status || IDLE;
        this.connection = run_type;
        //DOM节点
        this.from_lifecycle_dom = "";
        // 父级生命周期阶段
        this.parent_lifecycleterm = "";
        //坐标
        this.next_annotation_x = origin_x || WorkflowChain.prototype.next_x;
        this.next_annotation_y = origin_y || WorkflowChain.prototype.next_y;
        this.group_name_model = "";
    }

    /**
     * 新建节点
     * @param   {Number}    max_inner_para_len 当前工作流最大的并行节点个数
     * @param   {Boolean}   is_independent     是否是独立的工作流组
     */
    createNode(max_inner_para_len, is_independent) {
        if (!is_independent) {
            this.setAnnotationLen(max_inner_para_len);
            this.dom_model = this.drawWorkFlowAnnotation(this.name);
            this.next_dom_model = this.drawInterAnnotationConnection();
        } else {
            this.setAnnotationLen(undefined, 60);
            this.dom_model = this.drawWorkFlowAnnotation(this.name);
            this.next_dom_model = this.drawInterAnnotationConnection();
        }
        this.area.appendChild(this.dom_model);
        this.area.appendChild(this.next_dom_model);
        WorkflowChain.prototype.next_x = this.next_annotation_x;
        WorkflowChain.prototype.next_y = this.next_annotation_y;
        // this.setHoverEffect();
        // this.setDropdownEffect([{name:"合同1",value:1},{name:"合同2",value:2}]);
    }

    drawEndingNode() {
        let frag = document.createDocumentFragment();
        frag.appendChild(this.next_dom_model);
        frag = null;
    }

    /**
     * 创建生命周期和工作流框之间连线
     * @param  {Number} index               下标，标示第几个生命周期
     * @param  {Number} inter_lifecycle_len 生命周期间连线长度
     */
    linkFromLifeCycle(index, inter_lifecycle_len) {
        this.from_lifecycle_dom = this.drawConnectionBetweenLifecycleAndAnnotation(index, inter_lifecycle_len);
        this.area.appendChild(this.from_lifecycle_dom);
    }

    /**
     * 显示自身svg节点
     * @param  {Boolean} is_hidden       0是显示，1是隐藏，默认0
     */
    displaySelf(is_hidden = false) {
        if (!is_hidden) { //默认显示
            if (this.from_lifecycle_dom) { //隐藏与生命周期连接的线
                this.from_lifecycle_dom.setAttribute('style', 'visibility:visible');
            }
            this.dom_model.setAttribute('style', 'visibility:visible'); //隐藏工作流
            this.next_dom_model.setAttribute('style', 'visibility:visible');
            // if (this.group_name_model) this.group_name_model.setAttribute('style', 'visibility:visible');
            this.displayActions();
        } else {//如果不显示
            if (this.from_lifecycle_dom) {
                this.from_lifecycle_dom.setAttribute('style', 'visibility:hidden');
            }
            this.dom_model.setAttribute('style', 'visibility:hidden');
            this.next_dom_model.setAttribute('style', 'visibility:hidden');
            // if (this.group_name_model) this.group_name_model.setAttribute('style', 'visibility:hidden');
            this.displayActions(true);
        }
    }

    /**
     * 显示工作流中节点
     * @param  {Boolean} is_hidden       0是显示，1是隐藏，默认0
     */
    displayActions(is_hidden = false) {
        if (!is_hidden) { //默认显示
            this.action.forEach(function (node) {
                node.displaySelf();
            });

        } else {//如果不显示
            this.action.forEach(function (node) {
                node.displaySelf(true);
            });
        }
    }

    destroy(option = false) {
        this.action.forEach(function (flow) {
            flow.destroy(true);
        });
        if (option) {
            if (this.from_lifecycle_dom) this.from_lifecycle_dom.removeThisNode();
            if (this.dom_model) this.dom_model.removeThisNode();
            if (this.next_dom_model) this.next_dom_model.removeThisNode();
            if (this.group_name_model) this.group_name_model.removeThisNode();
        }
    }

    /**
     * 挂载工作流节点
     * @param  {WorkflowLink} new_action     工作流节点实例
     * @param  {Boolean}     formatted      是否格式化工作流节点
     */
    mountAction(new_action, formatted = false) {
        this.action.push(new_action);
        if (formatted) {
            if (new_action.connection === 1) {
                this.formatted_action.push([new_action]);
            } else {
                let len_formatted = this.formatted_action.length;
                if (typeof (this.formatted_action[len_formatted - 1]) === 'undefined' || !(this.formatted_action[len_formatted - 1][0].hasOwnProperty('connection')) || (this.formatted_action[len_formatted - 1][0].connection === 1)) {
                    this.formatted_action.push([new_action]);
                } else {
                    this.formatted_action[len_formatted - 1].push(new_action);
                }
            }
        }
        new_action.parent_workflow = this;
    }

    formattedAction() {
        // for(let i = 0;i < len; i++) {
        //     if(current_term.workflow[i].connection===2) {
        //         current_term.workflow[i].action[0].setStartNode();
        //     } else if(current_term.workflow[i].connection===1) {
        //         current_term.workflow[i].action[0].setStartNode();
        //         break;
        //     }
        // }
    }

    /**
     * 重置类变量
     */
    static refreshPrototypeVar() {
        WorkflowChain.prototype.next_x = null;
        WorkflowChain.prototype.next_y = null;
    }

    getStartAxises() {
        let rect = this.dom_model.querySelector("rect");
        return [Number(rect.getAttribute("x")), Number(rect.getAttribute("y"))];
    }
} // Class WorkflowChain

/**
 * 工作节点类，继承节点类
 * @extends LinkComponent
 */
class WorkflowLink extends LinkComponent {
    /**
     * @constructor
     * @param  {Number} origin_x        初始横坐标
     * @param  {Number} origin_y        初始纵坐标
     * @param  {Object} stylish         风格Object定义
     * @param  {Number} num_of_actions  该工作流有多少个节点
     * @param  {String} name            工作流节点名字
     * @param  {Number} id              工作流节点id
     * @param  {Number} run_type        工作流节点串并行
     * @param  {Number} status          工作流节点状态,2是已经完成，1是正在处理，1是还没到该环节
     * @param  {String} processInstanceId ID
     */
    constructor(origin_x, origin_y, stylish, num_of_actions, name, id, run_type, status, processInstanceId) {
        //stylish.inter_annotation_len = LinkComponent.prototype.inter_annotation_len;
        super(origin_x, origin_y, stylish, status, name);
        //数据
        this.id = id || "";
        this.processInstanceId = processInstanceId;
        //this.status = [IDLE, ACTIVE, RTODO][status];
        // console.log(this.status);
        this.connection = run_type;
        this.numOfAction = num_of_actions;

        //坐标
        this.next_approval_x = origin_x || WorkflowLink.prototype.next_x || (WorkflowChain.prototype.next_x + this.rect_width + 50);
        this.next_approval_y = origin_y || WorkflowLink.prototype.next_y || (WorkflowChain.prototype.next_y - LinkComponent.prototype.inter_annotation_len - this.rect_height / 2);
        //父级挂载工作流
        this.parent_workflow = "";

        this.next_par_approval_axis = WorkflowLink.prototype.next_par_axis || [];
        this.inner_par_approval_axis = WorkflowLink.prototype.inner_par_axis || [];
        //this.next_par_approval_axis = [];
        // console.log('new action',this.next_par_approval_axis,WorkflowLink.prototype.next_par_axis);

        WorkflowLink.prototype.isEnd = 0;
    }

    /**
     * 创建工作流中的节点
     * @param  {Number}     flag                            向左向右标记，0向右画，1向左画
     * @param  {Boolean}    current_is_ending_node          是否是当前工作流最后一个节点
     * @param  {Boolean}    current_workflow_is_para        当前工作流是否是并行节点
     * @param  {Number}     current_para_workflow_num       当前所处的工作流组如果是并行，这个是并行工作流个数
     * @param  {Number}     current_para_workflow_index     并行工作流下标
     * @param  {Boolean}    next_workflow_is_para           下一个工作流是否是并行节点
     * @param  {Number}     next_para_workflow_num          下一个并行的工作流个数
     * @param  {Boolean}    current_node_is_para            当前节点是否是并行节点
     * @param  {Number}     current_para_node_num           当前工作流内并行数量，默认为2
     * @param  {Number}     current_para_node_index         当前工作流节点处于工作流堆对应的下标
     * @param  {Boolean}    next_node_is_para               下一个工作流节点是否是并行，0是串行，1是并行，默认0
     * @param  {Number}     next_para_node_num              下一个并行工作流节点组中节点的数量，默认为2
     * @param  {Number}     max_inner_para_num              当前工作流中最大并行节点个数
     * @param  {Number}     current_node_num                当前工作流节点数据
     * @param  {Number}     current_node_index              当前工作流节点下标，内并行算一个index
     */
    createNode(flag,
               current_is_ending_node = false,
               current_workflow_is_para = false,
               current_para_workflow_num = 2,
               current_para_workflow_index = 0,
               next_workflow_is_para = false,
               next_para_workflow_num = 2,
               current_node_is_para = false,
               current_para_node_num = 2,
               current_para_node_index = 0,
               next_node_is_para = false,
               next_para_node_num = 2, max_inner_para_num, current_node_num,
               current_node_index = 0) {
        //总长度
        const connection_len = (800 - this.numOfAction * (2 * this.arc_radius)) / (this.numOfAction - 1) || (800 - this.numOfAction * (2 * this.arc_radius));

        //如果以并行工作流开始创建生命周期
        if (this.next_par_approval_axis.length === 0 && current_workflow_is_para && this.parent_workflow.action.length === 1) {
            let i = 0;

            while (i < current_para_workflow_num) {
                if (i !== 0) this.setAnnotationLen(null, LinkComponent.prototype.inter_annotation_len);
                this.next_par_approval_axis.push({
                    x: (WorkflowChain.prototype.next_x + this.rect_width + 50),
                    y: (WorkflowChain.prototype.next_y - LinkComponent.prototype.inter_annotation_len - this.rect_height / 2 + i * (this.inter_annotation_len + this.rect_height))
                });
                i++;
            }
        }

        // if(current_para_workflow_index!==0 && current_node_index!==0 && current_workflow_is_para) {
        //     this.next_par_approval_axis[current_para_workflow_index].x = ((this.getPolyAngleAxis(this.six_polyLen))[5][0] + this.six_polyLen /2 + this.rect_width/2+50);
        //     this.next_par_approval_axis[current_para_workflow_index].y = ((this.getPolyAngleAxis(this.six_polyLen))[5][1] + this.rect_height / 2 + 90 + current_para_workflow_index*(this.inter_annotation_len+this.rect_height));
        // }

        let self = this;
        //设置inner_par_approval_axis初始值，可能以并行节点开始
        (function (num, next_para_node_num) {
            let inner_para_line_len = 2 * self.arc_radius;
            if (Array.isArray(WorkflowLink.prototype.inner_par_axis) && WorkflowLink.prototype.inner_par_axis.length===0) {
                let isOdd = num % 2 !== 0;
                for (let i = 1; i <= Math.ceil(next_para_node_num / 2); i++) {
                    if (isOdd && i === 1) { //如果是奇数而且是第一个，则直接往下划线即可
                        self.inner_par_approval_axis.push({
                            x: self.next_approval_x,
                            y: self.next_approval_y
                        });
                        continue;
                    }
                    //middle_line = middle_line.setAxis(middle_x, middle_y).drawBottomToRightArc(this.arc_radius);
                    let offset = 2 * self.arc_radius;
                    if (isOdd) {
                        //middle_line.drawDownwardLine((i-2) * inner_para_line_len, 1);
                        offset += (i - 2) * inner_para_line_len;
                    } else {
                        //middle_line.drawDownwardLine((i-1) * inner_para_line_len, 1);
                        offset += (i - 1) * inner_para_line_len;
                    }

                    self.inner_par_approval_axis.unshift({
                        x: self.next_approval_x,
                        y: self.next_approval_y - offset
                    });

                    self.inner_par_approval_axis.push({
                        x: self.next_approval_x,
                        y: self.next_approval_y + offset
                    });
                }
            }
        })(current_para_node_num, next_para_node_num);
        if (!current_workflow_is_para) { //如果创建串行节点
            if (!current_is_ending_node) { //如果不是当前工作流的最后一个节点
                //console.log("the flag",flag);
                this.dom_model = this.drawWorkflowNode(this.name, undefined, flag, null, null, current_node_is_para, current_para_node_index, current_para_node_num, current_node_num);
                this.next_dom_model = this.drawInnerWorkflowNodeConnection(connection_len, flag, null, null, next_node_is_para, next_para_node_num, current_node_is_para, current_para_node_index, current_para_node_num);

                WorkflowLink.prototype.next_x = this.x;
                WorkflowLink.prototype.next_y = this.y;
                WorkflowLink.prototype.inner_par_axis = this.inner_par_approval_axis;
            } else { //如果是当前工作流的最后一个节点
                this.dom_model = this.drawWorkflowNode(this.name, undefined, flag, undefined, undefined, current_node_is_para, current_para_node_index, current_para_node_num, current_node_num);

                if (!next_workflow_is_para) { //如果下一个节点是串行
                    //*注意*，flag指定当前流程图像方向，is_end判断是否是最后一个节点，当图像向右flag=0，并且是最后一个节点is_end=1,画的下一层工作流应该向左拐
                    //给的direction参数应该为1，所以1 m 0 = 1
                    //当图像向左flag=1,并且is_end=1, 下一层工作流应该向右拐，所以1 m 1 = 0; 所以这里的m操作是异或is_end^flag
                    this.next_dom_model = this.drawInterWorkflowNodeConnection(current_is_ending_node ^ flag, 0, null, 0, undefined, undefined, max_inner_para_num);
                } else { //如果下一个节点是并行
                    this.next_dom_model = this.drawInterWorkflowNodeConnection(current_is_ending_node ^ flag, 0, next_para_workflow_num, 1, undefined, undefined, max_inner_para_num);
                }

                WorkflowLink.prototype.next_x = this.x;
                WorkflowLink.prototype.next_y = this.y;
                WorkflowLink.prototype.next_par_axis = this.next_par_approval_axis;
                WorkflowLink.prototype.inner_par_axis = [];
            }
            //console.log('in class status',this.status);

            this.area.appendChild(this.dom_model);
            this.area.appendChild(this.next_dom_model);
        } else { //如果创建并行节点
            if (!current_is_ending_node) {//如果不是当前工作流的最后一个节点

                this.dom_model = this.drawWorkflowNode(this.name, undefined, flag, 1, current_para_workflow_index, current_node_is_para, current_para_node_index, current_para_node_num, current_node_num);
                this.next_dom_model = this.drawInnerWorkflowNodeConnection(connection_len, flag, 1, current_para_workflow_index, next_node_is_para, next_para_node_num, current_node_is_para, current_para_node_index, current_para_node_num);

            } else { //如果是当前工作流的最后一个节点

                this.dom_model = this.drawWorkflowNode(this.name, undefined, flag, 1, current_para_workflow_index, current_node_is_para, current_para_node_index, current_para_node_num, current_node_num);
                if (!next_workflow_is_para) { //如果下一个节点是串行
                    this.next_dom_model = this.drawInterWorkflowNodeConnection(current_is_ending_node ^ flag, 1, next_para_workflow_num, 0, current_para_workflow_num, current_para_workflow_index, max_inner_para_num);
                } else { //如果下一节点是并行
                    this.next_dom_model = this.drawInterWorkflowNodeConnection(current_is_ending_node ^ flag, 1, next_para_workflow_num, 1, current_para_workflow_num, current_para_workflow_index, max_inner_para_num);
                }
                WorkflowLink.prototype.next_x = this.next_approval_x;
                WorkflowLink.prototype.next_y = this.next_approval_y;
                WorkflowLink.prototype.inner_par_axis = [];
            }
            this.area.appendChild(this.dom_model);
            this.area.appendChild(this.next_dom_model);
            // console.log('action create',this.next_par_approval_axis ,WorkflowLink.prototype.next_par_axis);
            WorkflowLink.prototype.next_par_axis = this.next_par_approval_axis;
        }
        this.setStatus(this.status);
        this.setClickEffect({
            productNo: this.parent_workflow.parent_lifecycleterm.parent_lifecycle.product_no,
            processInstanceId: this.processInstanceId,
            linkId: this.id
        });
        if (this.be_ellipsis) {
            this.setHoverEffect();
        }
    }

    /**
     * 设置状态，不同状态样式不同
     * @param  {Symbol} status      IDLE, ACTIVE, RTODO
     * @param  {Boolean} is_compile 是否编译path
     */
    setStatus(status, is_compile = false) {
        if (status === IDLE) {
            this.dom_model.setAttribute('stroke', 'black');

            this.dom_model.querySelector('.action-point').setAttributeItems({
                "stroke": "black",
                "fill": "black"
            });

            this.dom_model.querySelector('.text-annotate').setAttribute('stroke', 'black');
            Array.prototype.forEach.call(this.dom_model.childNodes, function (dom) {
                dom.setAttribute('stroke', 'black');
            });
            Array.prototype.forEach.call(this.next_dom_model.childNodes, function (dom) {
                dom.setAttribute('stroke', 'black');
            });
        } else if (status === ACTIVE) {
            //this.dom_model.childNodes[0].setAttribute('stroke', 'black');
            this.dom_model.querySelector('.action-point').setAttributeItems({
                "stroke": "red",
                "fill": "red"
            });
            this.dom_model.querySelector('.text-annotate').setAttribute('stroke', 'red');

        } else if (status === RTODO) {
            this.dom_model.setAttribute('stroke', 'silver');
            Array.prototype.forEach.call(this.dom_model.childNodes, function (dom) {
                dom.setAttribute('stroke', 'silver');
                dom.setAttribute('fill', 'silver');
            });
        }

        if (!is_compile) {
            let total_path = GraphHelper.compilePath(this.next_dom_model);
            this.next_dom_model.innerHTML = "";
            this.next_dom_model.appendChild(total_path);
        }

        if (status === ACTIVE) {
            AnimationHelper.addActivePathAnimation(this.next_dom_model.firstChild);
            //this.area.appendChild(AnimationHelper.generateCarSvg());
        } else {
            AnimationHelper.addPathAnimation(this.next_dom_model.firstChild);
        }
    }

    /**
     * 设置起始节点的样式
     */
    setStartNode() {
        this.dom_model.removeChild(this.dom_model.firstChild);
    }

    /**
     * 重置类变量
     */
    static refreshPrototypeVar() {
        WorkflowLink.prototype.next_par_axis = [];
        WorkflowLink.prototype.next_x = null;
        WorkflowLink.prototype.next_y = null;
        WorkflowLink.prototype.inner_par_axis = [];
    }

    /**
     * 显示自身svg节点
     * @param  {Boolean} is_hidden   是否显示，0显示，1隐藏，默认0
     */
    displaySelf(is_hidden = false) {
        if (!is_hidden) { //默认显示
            this.dom_model.setAttribute('style', 'visibility:visible');
            if (this.next_dom_model) this.next_dom_model.setAttribute('style', 'visibility:visible');
        } else { //如果不显示
            this.dom_model.setAttribute('style', 'visibility:hidden');
            if (this.next_dom_model) this.next_dom_model.setAttribute('style', 'visibility:hidden');

        }
    }

    destroy(option = false) {
        if (option) {
            if (this.dom_model) this.dom_model.removeThisNode();
            if (this.next_dom_model) this.next_dom_model.removeThisNode();
        }
    }

    setClickEffect(react_info) {
        let self = this;
        // console.log(self.status);
        if (self.status === IDLE || self.status === ACTIVE) {
            this.dom_model.setAttribute("class", "clickable-link");
            this.dom_model.addEventListener('click', function (event) {
                // event.stopPropagation();
                if (self.status === ACTIVE) {
                    swal({
                            title: "提示",
                            text: "您确认要进入" + self.name + "节点？",
                            showCancelButton: true,
                            confirmButtonColor: "#E1524F",
                            confirmButtonText: "确定",
                            cancelButtonText: "取消",
                            cancelButtonColor: "#E999",
                            closeOnConfirm: true
                        },
                        function () {
                            //进入节点
                            let indicator = self.parent_workflow.parent_workflow_group.current_indicator;
                            //console.log(self.parent_workflow.parent_workflow_group.candidateName,indicator);
                            // specialAccountSer.queryApprovedLink(react_info, function (res) {
                            if (self.status === IDLE) $scope.enterApprovedPage(react_info.processInstanceId, react_info.productNo, self.id, self.parent_workflow.parent_workflow_group.candidateName[indicator]);
                            if (self.status === ACTIVE) $scope.enterApprovingPage(react_info.processInstanceId, react_info.productNo, self.id, self.parent_workflow.parent_workflow_group.candidateName[indicator]);
                            // });
                        });
                } else {
                    swal("提示", "该节点已经审批完成", "warning");
                }
            }, true);
        }
    }
} // Class WorkflowLink

/**
 * class WorkflowChainGroup
 * 工作流组类，用于组合工作流并且初始化一些工作流组才有的属性
 * @extends LinkComponent
 * this.group[groupIndex].items[candidateIndex][workflowIndex]
 */
class WorkflowChainGroup extends LinkComponent {
    constructor() {
        super(undefined, undefined, {});
        this.group = [];
        this.is_independent = false;
        this.current_indicator = 0;
    }

    /**
     * 将工作流放进一个组
     * @param index
     * @param indicator
     * @param workflow
     * @param group_name
     */
    pushIntoGroup(index, indicator, workflow, group_name) {
        if (!this.group[index]) {
            this.group[index] = {};
        }
        if (!this.group[index].items) {
            this.group[index].items = [];
        }
        if (!this.group[index].candidateName) {
            this.group[index].candidateName = [];
        }
        if (!this.group[index]['items'][indicator]) {
            this.group[index]['items'][indicator] = [];
        }
        // this.group[index].groupName = group_name;
        this.group[index]['items'][indicator].push(workflow);
        this.group[index].current_indicator = this.current_indicator;
        workflow.parent_workflow_group = this.group[index];
        let len_candidates = this.group[index].items.length;
        let len_workflows = this.group[index]['items'][indicator].length;
        if (len_candidates !== 1) {
            this.group[index]['items'][indicator][len_workflows - 1].displaySelf(true);
        }
        this.setGroupName(index, group_name);
    }

    /**
     * 设定工作流组的名称
     * @param index
     * @param name
     */
    setGroupName(index, name) {
        if (!this.group[index].group_name) {
            this.group[index].group_name = name;
            let [x, y] = this.group[index].items[0][0].getStartAxises();
            this.group[index].items[0][0].group_name_model = this.group[index].items[0][0].setAxis(x, y).drawTextAnnotation(this.group[index].group_name, 'start', undefined, 0, -5);
            this.area.appendChild(this.group[index].items[0][0].group_name_model);
        }
    }

    setCandidateWorkflowName(index, name, indicator) {
        this.group[index].candidateName[indicator] = name;
    }

    /**
     * 切换工作流组
     * @param index         {Number}
     * @param indicator     {Number}
     */
    switchWorkflowGroup(index, indicator) {
        this.group[index].items.forEach(function (candidate_group) {
            candidate_group.forEach(function (workflow_chain) {
                workflow_chain.displaySelf(true);
            });
        });
        this.group[index].current_indicator = indicator;
        this.group[index].items[indicator].forEach(function (workflow_chain) {
            workflow_chain.displaySelf();
        });
    }

    setDropdownEffect() {
        let self = this;
        let wrapper, dropdown;
        this.group.forEach(function (group, groupIndex) {
            let list = `<ul data-group-index="${groupIndex}">`;
            //group.items.forEach(function (item, indicator) {
            for (let indicator = group.items.length - 1; indicator >= 0; indicator--) {
                list += `<li data-indicator="${indicator}">${group.candidateName[indicator]}</li>`;
                if (group.items.length > 1) {
                    group.items[indicator][0].dom_model.setAttribute("class", "dropable-list");
                    group.items[indicator][0].dom_model.addEventListener('click', function (event) {
                        if (dropdown && event.target !== dropdown) {
                            dropdown = null;
                            let trash_dom = document.createDocumentFragment();
                            trash_dom.appendChild(wrapper);
                            trash_dom = null;
                        } else {
                            dropdown = document.createElement("div");
                            dropdown.setAttribute("class", "dropdown-list");
                            dropdown.innerHTML = list;
                            let x = event.target.getBBox().x;
                            let y = event.target.getBBox().y;
                            wrapper = document.createElementNS(NAMESPACE, 'foreignObject');
                            dropdown.setAttribute("style", `z-index:9999;top:${y + 10}px;left:${x}px;display:block;`);
                            wrapper.appendChild(dropdown);
                            self.area.appendChild(wrapper);
                        }
                    });
                }
            }
            //});
        });

        self.area.addEventListener('click', function (event) {
            if (dropdown && event.target.nodeName === "LI") {
                let option_dom = event.target;
                self.switchWorkflowGroup(option_dom.parentElement.getAttribute("data-group-index"), option_dom.getAttribute("data-indicator"));
            } else if (dropdown && event.target !== dropdown) {
                dropdown = null;
                let trash_dom = document.createDocumentFragment();
                trash_dom.appendChild(wrapper);
                trash_dom = null;
            }
        }, true);
    }

} // class WorkflowChainGroup

/**
 * LifecycleController类，管理所有的Lifecycle实例与实例的事件捕捉
 */
class LifeCycleController {
    constructor() {
        this.lifecycle_term = [];
        LifecycleLink.refreshPrototypeVar();
        WorkflowChain.refreshPrototypeVar();
        WorkflowLink.refreshPrototypeVar();
    }

    lifecycleClick() {
    }

    mountLifeCycleTerm(origin_x, origin_y, line_width, stroke_color, stylish, num_of_lifecycle, name, id_bundle, is_last) {
        let new_term = new LifecycleLink(origin_x, origin_y, {
            fill_color: "silver",
            line_color: "silver"
        }, num_of_lifecycle, name, id_bundle);
        new_term.createNode();
        if (is_last) {
            new_term.drawEndingNode();
        }
        this.mountTerm(new_term);
        new_term.parent_lifecycle = this;
    }

    /**
     * 挂载新的生命周期阶段
     * @param term      生命周期阶段
     */
    mountTerm(term) {
        //绑定this,否则触发函数this指向dom
        term.dom_model.addEventListener('click', this.lifecycleClick.bind(this));
        this.lifecycle_term.push(term);
    }

    /**
     * 设置边界Node的样式
     */
    setBoundingNode(current_term) {
        //console.log(this);
        //console.log(this.lifecycle_term);
        //this.lifecycle_term.forEach(function (current_term) {
        if (current_term.status === ACTIVE) { //获取激活的生命周期
            let len = current_term.workflow.length;
            // current_term.workflow[0].action[0].setStartNode();
            current_term.workflow[len - 1].drawEndingNode();

            // 这个不需要了因为节点的两边小尾巴长度都设为0了，所以暂时不需要这个循环了
            // 如果需要去除开始节点的冗余节点，就使用这个函数
            // for(let i = 0;i < len; i++) {
            //     if(current_term.workflow[i].connection===2) {
            //         current_term.workflow[i].action[0].setStartNode();
            //     } else if(current_term.workflow[i].connection===1) {
            //         current_term.workflow[i].action[0].setStartNode();
            //         break;
            //     }
            // }

            function actionEndingSetting(workflow) {
                let formatted_action_len = workflow.formatted_action.length;
                let action_len = workflow.formatted_action[formatted_action_len - 1].length;
                for (let i = 0; i < action_len; i++) {
                    workflow.formatted_action[formatted_action_len - 1][i].drawEndingNode();
                }
            }

            if (current_term.workflow[len - 1].connection === 2) {
                for (let i = len - 1; i >= 0; i--) {
                    let action_len = current_term.workflow[i].action.length;
                    if (current_term.workflow[i].connection === 2) {
                        actionEndingSetting(current_term.workflow[i]);
                        // current_term.workflow[i].action[action_len-1].createEndingNode();
                    } else {
                        break;
                    }
                }
            } else {
                let action_len = current_term.workflow[len - 1].action.length;
                actionEndingSetting(current_term.workflow[len - 1]);
            }
        }
        //});
    }

    /**
     * @deprecated
     * 遍历生命周期，重新设置linkStatus
     * 因为后台当时只能返回激活的节点状态，所以其它的节点状态需要自己遍历判断
     */
    formatLinkStatusStyle() {
        let has_active = false;
        let active_workflow_flag;
        let workflow_set = [];
        let set_index = 0;

        function setAllActionsIdle(actions) {
            actions.forEach(function (action) {
                action.setStatus(IDLE, true);
            });
        }

        function setAllActionsRTODO(actions) {
            actions.forEach(function (action) {
                action.setStatus(RTODO, true);
            });
        }

        function setProperActiveWorkflow(actions) {
            let hasActiveNode = false;
            actions.forEach(function (action) {
                if (action.status === ACTIVE) {
                    hasActiveNode = true;
                } else {
                    if (!hasActiveNode) {
                        action.setStatus(IDLE, true);
                    }
                }
            });
            return hasActiveNode;
        }

        function setFormattedActiveActions(formatted_action) {
            let hasActiveNode = false;
            formatted_action.forEach(function (action_slice) {

                if (action_slice.length === 1) {
                    if (action_slice[0].status === ACTIVE) {
                        hasActiveNode = true;
                    } else {
                        if (!hasActiveNode) {
                            action_slice[0].setStatus(IDLE, true);
                        }
                    }
                } else {
                    let current_slice_has_active = false;
                    action_slice.forEach(function (action) {
                        if (action.status === ACTIVE) {
                            current_slice_has_active = true;
                            hasActiveNode = true;
                        }
                    });
                    action_slice.forEach(function (action) {
                        if (current_slice_has_active) {
                            if (action.status === RTODO) action.setStatus(IDLE);
                        } else {
                            if (!hasActiveNode) action.setStatus(IDLE)
                        }
                    });
                }
            });
            return hasActiveNode;
        }

        this.lifecycle_term.forEach(function (lifecycle) {
            let workflow_list = lifecycle.workflow;
            let len_workflow_list = workflow_list.length;
            //将并行的工作流放为一堆
            for (let i = 0; i < len_workflow_list; i++) {
                if (typeof (workflow_set[set_index]) !== 'object') workflow_set[set_index] = [];
                if (workflow_list[i].connection === 2) {
                    workflow_set[set_index].push(workflow_list[i]);
                    if (i + 1 < len_workflow_list && workflow_list[i + 1].connection === 1) {
                        set_index++;
                    }
                }
                if (workflow_list[i].connection === 1) {
                    workflow_set[set_index].push(workflow_list[i]);
                    set_index++;
                }
            }

            //工作流堆循环
            let serial_node_activated = false;
            let para_node_activated = false;
            workflow_set.forEach(function (workflow_slice, flow_set_index) {

                //一个堆中工作流循环
                workflow_slice.forEach(function (workflow, slice_index) {
                    if (workflow_slice.length > 1) { //如果是并行工作流
                        if (!serial_node_activated) { //如果串行工作流还没被激活
                            para_node_activated |= setFormattedActiveActions(workflow.formatted_action);
                        }
                    } else { //如果是串行工作流
                        if (!para_node_activated && !serial_node_activated) { //如果并行和串行工作流还没被激活
                            serial_node_activated = setFormattedActiveActions(workflow.formatted_action);
                        } else {
                            setAllActionsRTODO(workflow.action);
                        }
                    }
                });
            })
        });
    }
}

/**
 * StaticLifeCycleController
 * 静态生命周期流程展示
 * @extends LifeCycleController
 */
class StaticLifeCycleController extends LifeCycleController {
    constructor() {
        super();
    }

    /**
     * 点击事件，调用静态生命周期导航图展示接口
     */
    lifecycleClick() {
        let event = arguments[0];
        let self = this;
        //将其余生命周期节点设置为IDLE
        //console.log(this);
        this.lifecycle_term.forEach(function (term) {
            term.setStatus(HIDDEN, true);
            //term.displayWorkflows(1);
        });
        let index = getChildrenIndex(event.target.parentNode) / 2;

        this.lifecycle_term[index].setStatus(ACTIVE, true);
        // console.log(this.lifecycle_term[index].status);
        let current_term = this.lifecycle_term[index];
        LifeCycleController.prototype.currentSelect = index; //获取当前选择的生命周期
        //console.log('index', index, current_term.connect_to_annotation_x, current_term.connect_to_annotation_y);
        // if (current_term.workflow.length === 0) { //还没有获取相应的工作流组信息 TODO 打开用于是否将已经取回的周期阶段进行展示，而不是重新请求，但是在计算新的周期导航图的容器高度上会有bug，不会重新计算高度
        //console.log(current_term.processInstanceId);
        let workflow_groups = new WorkflowChainGroup();
        specialAccountSer.queryLifecycleDetail({"workflowIds": current_term.workflowIds}, function (data) {
            //console.log(data);
            if (data.code === '000000') {
                data.data.forEach(function (life, groupIndex) {
                    let FLAG = 0; //FLAG为标志位，会在循环中0,1交替变化以控制当前图向左还是向右
                    life.lifeCyclePeriodGroupDetails.forEach(function (node, i) {
                        node.periodDetails.forEach(function (workflow, j) { //如果这一层循环次数大于1，则说明这层工作流是并行工作流
                            let workflow_annotaion, next_is_para, next_para_len;
                            let action_list = workflow.lifeCyclePartVO.links; //当前工作流中的节点列表

                            let next_action_list;
                            if (j < node.periodDetails.length - 1) {
                                next_action_list = node.periodDetails[j + 1].lifeCyclePartVO.links;
                            } else {
                                if (i < life.lifeCyclePeriodGroupDetails.length - 1)
                                    next_action_list = life.lifeCyclePeriodGroupDetails[i + 1].periodDetails[0].lifeCyclePartVO.links;
                            }
                            let len_action_list = action_list.length; //节点列表元素个数
                            let periodDetails_len = node.periodDetails.length; //工作流组中工作流数目
                            let workflow_info = workflow.lifeCyclePartVO.workFlowDO; //工作流详情信息
                            if (i < life.lifeCyclePeriodGroupDetails.length - 1) {
                                next_is_para = life.lifeCyclePeriodGroupDetails[i + 1].runType > 1 ? 1 : 0;
                                next_para_len = life.lifeCyclePeriodGroupDetails[i + 1].periodDetails.length;
                            } else { //如果循环到工作流组最后一个工作流
                                next_is_para = 0;
                                next_para_len = 0;
                            }
                            //console.log("下一环节",node.runType);

                            let current_runtype = node.runType > 1; //false是串行，true是并行


                            let max_inner_para_num = 0, current_max_num = 0, next_max_num = 0;
                            //for(let i = 0;;i++) {
                            //将工作流节点分成一批批，并行放一堆，按顺序放置
                            function formatAction(action_list) {
                                let action_set = [];
                                let len_action_list = action_list.length;
                                let set_index = 0;
                                for (let i = 0; i < len_action_list; i++) {
                                    if (typeof (action_set[set_index]) !== 'object') action_set[set_index] = [];
                                    if (action_list[i].currentRunType === 2) {
                                        action_set[set_index].push(action_list[i]);
                                    }
                                    if (action_list[i].currentRunType === 1) {
                                        if (i - 1 >= 0 && action_list[i - 1].currentRunType === 2) {
                                            action_set[set_index].push(action_list[i]);
                                        } else {
                                            action_set[set_index].push(action_list[i])
                                        }
                                        set_index++;
                                    }
                                }
                                return action_set;
                            }

                            let next_action_set, action_set;

                            if (typeof (action_list) !== 'undefined') {
                                action_set = formatAction(action_list);

                                action_set.forEach(function (action_slice) {
                                    if (action_slice.length > max_inner_para_num) max_inner_para_num = action_slice.length;
                                });
                            }

                            if (typeof (next_action_list) !== 'undefined') {
                                next_action_set = formatAction(next_action_list);
                                next_action_set.forEach(function (action_slice) {
                                    if (action_slice.length > next_max_num) next_max_num = action_slice.length;
                                });
                            }


                            let workflow_style = {
                                fill_color: "transparent",
                                line_color: "silver",
                                text_color: "silver"
                            };
                            if (i === 0 && j === 0 && groupIndex === 0) { //如果是工作流组的第一个工作流
                                workflow_annotaion = new WorkflowChain(current_term.connect_to_annotation_x, current_term.connect_to_annotation_y, workflow_style, workflow_info.flowName, workflow_info.id, IDLE, node.runType);
                                current_term.mountWorkflow(workflow_annotaion);
                                workflow_annotaion.linkFromLifeCycle(index, current_term.connect_len);
                                // workflow_annotaion.group_name_model = workflow_annotaion.drawTextAnnotation(life.workflowGroupName, 'start', undefined, -70, -10);
                                // workflow_annotaion.area.appendChild(workflow_annotaion.group_name_model);
                                workflow_annotaion.createNode(next_max_num, next_max_num === 0);
                            } else { //如果第一个工作流已经连接上
                                workflow_annotaion = new WorkflowChain(null, null, workflow_style, workflow_info.flowName, workflow_info.id, IDLE, node.runType);
                                current_term.mountWorkflow(workflow_annotaion);
                                workflow_annotaion.createNode(next_max_num, next_max_num === 0);
                                // if(next_max_num===0 && groupIndex+1<data.data.length) {
                                //     workflow_annotaion.group_name_model = workflow_annotaion.drawTextAnnotation(data.data[groupIndex+1].workflowGroupName, 'start', undefined, -70, -10);
                                //     workflow_annotaion.area.appendChild(workflow_annotaion.group_name_model);
                                // }
                            }
                            // current_term.mountWorkflow(workflow_annotaion);

                            let action_count = 0;
                            let len_action_set = action_set.length;
                            action_set.forEach(function (actions_slice, slice_index) { //工作流节点堆循环
                                let inner_current_len_actions = actions_slice.length;
                                let inner_current_runType = inner_current_len_actions > 1;
                                let inner_next_len_actions, inner_next_runType;
                                if (slice_index < len_action_set - 1) {
                                    inner_next_len_actions = action_set[slice_index + 1].length;
                                    inner_next_runType = action_set[slice_index + 1].length > 1;
                                } else {
                                    inner_next_len_actions = 0;
                                    inner_next_runType = 0;
                                }
                                actions_slice.forEach(function (action, action_index) { //堆中工作流节点循环
                                    let new_action = new WorkflowLink(null, null, {line_color: "silver"}, len_action_set, action.linkName, action.id, inner_current_runType ? 2 : 1, action.linkStatus);
                                    workflow_annotaion.mountAction(new_action, true);
                                    new_action.parent_workflow = workflow_annotaion;
                                    if (node.runType === 1) { //如果当前是串行工作流，则periodDetails数组只有一个元素
                                        if (action_count === len_action_list - 1) { //如果是最后一个工作流节点
                                            new_action.createNode(FLAG, true, current_runtype, periodDetails_len, 0, next_is_para, next_para_len, inner_current_runType, inner_current_len_actions, action_index, inner_next_runType, inner_next_len_actions, next_max_num, len_action_set, slice_index);
                                        } else {
                                            new_action.createNode(FLAG, false, current_runtype, periodDetails_len, 0, next_is_para, next_para_len, inner_current_runType, inner_current_len_actions, action_index, inner_next_runType, inner_next_len_actions, next_max_num, len_action_set, slice_index);
                                        }
                                    } else if (node.runType === 2) { //如果当前是并行工作流组，则periodDetails数组有多个元素
                                        if (action_count === len_action_list - 1) { //如果是最后一个工作流节点
                                            new_action.createNode(FLAG, true, current_runtype, periodDetails_len, j, next_is_para, next_para_len, inner_current_runType, inner_current_len_actions, action_index, inner_next_runType, inner_next_len_actions, next_max_num, len_action_set, slice_index);
                                        } else {
                                            new_action.createNode(FLAG, false, current_runtype, periodDetails_len, j, next_is_para, next_para_len, inner_current_runType, inner_current_len_actions, action_index, inner_next_runType, inner_next_len_actions, next_max_num, len_action_set, slice_index);
                                        }
                                    }

                                    action_count++;
                                });
                            });

                            // 这个flag控制画的方向
                            if (FLAG === 0) { //flag为0，应该交替变换
                                if (current_runtype === 0) { //如果是串行且当前是0，则flag直接变为1
                                    FLAG = 1;
                                } else { //如果是并行且当前是0
                                    if (j === periodDetails_len - 1) { //如果是工作流组最后一个工作流，则应该变flag为1
                                        FLAG = 1;
                                    } else { //如果不是工作流组最后一个工作流，则不应该变FLAG
                                        FLAG = 0;
                                    }
                                }
                            } else { //flag为1，应该交替变换
                                if (current_runtype === 0) { //如果是串行且当前是1，则flag直接变为0
                                    FLAG = 0;
                                } else {
                                    if (j === periodDetails_len - 1) { //如果是工作流组最后一个工作流，则应该变flag为0
                                        FLAG = 0;
                                    } else { //如果不是工作流组最后一个工作流，则不应该变FLAG
                                        FLAG = 1;
                                    }
                                }
                            }
                            // 静态生命周期里没有候选工作流组的数据，所以调这个函数将indicator都置为0
                            workflow_groups.pushIntoGroup(groupIndex, 0, workflow_annotaion, life.workflowGroupName);
                        });

                    });
                    //设置边界节点样式
                    self.setBoundingNode(current_term);
                    // 每个工作流组生成完毕应该讲ActionModel的原型公共属性给清空掉
                    WorkflowLink.refreshPrototypeVar();
                });

                //生命周期json解析完毕

                // 重新设置path，将相连的path组合，为了更好的动画效果
                GraphHelper.reconstructPath(current_term);
                setSVGWrapperHeight(document.getElementById('playground'), WorkflowChain.prototype.next_y);
                //重置使用的原型变量，供下一个点击事件构建变量使用
                LifecycleLink.refreshPrototypeVar();
                // if(current_term.processInstanceId) self.formatLinkStatusStyle();
                WorkflowChain.refreshPrototypeVar();
            } // if data code
        }); //queryLifecycleDetail

        // } else { //如果已经获取过工作流
        //     current_term.displayWorkflows();
        //     setSVGWrapperHeight(document.getElementById('playground'),WorkflowChain.prototype.next_y);
        // }

    } // lifecycleClick()
}

/**
 * DynamicLifeCycleController
 * 动态生命周期流程展示-生命周期与产品绑定好后的动态效果以及交互
 * @extends LifeCycleController
 */
class DynamicLifeCycleController extends LifeCycleController {
    constructor(product_no) {
        super();
        this.product_no = product_no;
    }

    /**
     * 点击事件，调用动态生命周期导航图展示接口
     */
    lifecycleClick() {
        let event = arguments[0];
        let self = this;
        // basicFnSer.loading();
        //将其余生命周期节点设置为IDLE
        //console.log(this);
        this.lifecycle_term.forEach(function (term) {
            term.setStatus(HIDDEN, true);
            //term.displayWorkflows(1);
        });
        let index = getChildrenIndex(event.target.parentNode) / 2;

        this.lifecycle_term[index].setStatus(ACTIVE, true);
        // console.log(this.lifecycle_term[index].status);
        let current_term = this.lifecycle_term[index];
        LifeCycleController.prototype.currentSelect = index; //获取当前选择的生命周期
        //console.log('index', index, current_term.connect_to_annotation_x, current_term.connect_to_annotation_y);
        // if (current_term.workflow.length === 0) { //还没有获取相应的工作流组信息  @deprecated 打开用于是否将已经取回的周期阶段进行展示，而不是重新请求，但是在计算新的周期导航图的容器高度上会有bug，不会重新计算高度
        //console.log(current_term.processInstanceId);
        let param = {
            periodRecordId: current_term.periodRecordId,
            lifeCyclePeriodId: current_term.lifeCyclePeriodId,
            productNo: this.product_no
        };
        let workflow_groups = new WorkflowChainGroup()
        let data = mockData().lifecycle;
        // specialAccountSer.queryLifecycleRunningDetail(param, function (data) {
        //     basicFnSer.loadingHide(function () {
                if (data.code === '000000') {
                    data.data.forEach(function (life, groupIndex) {
                        let FLAG = 0; //FLAG为标志位，会在循环中0,1交替变化以控制当前图向左还是向右
                        // 工作流组下标，因为同个工作流组有可能被多次发起，而要显示其中的某一个，所以需要下标标示一下
                        // 这层循环的是工作流候选组，因为工作流组能多次发起，则多次发起的工作流组periodGroupRecordList里会有多个元素
                        for (let group_indicator = 0; group_indicator < life.periodGroupRecordList.length; group_indicator++) {
                            life.periodGroupRecordList[group_indicator].forEach(function (node, workflow_batch_index) { //这层循环的是工作流堆，并行的工作流会放在一个堆中
                                node.periodDetails.forEach(function (workflow, workflow_index) { //这层循环的是其中的一个工作流堆，如果这一层循环次数大于1，则说明这工作流堆的工作流是并行工作流
                                    let workflow_annotaion, next_is_para, next_para_len;
                                    let action_list = workflow.lifeCyclePartVO.links; //当前工作流中的节点列表

                                    let next_action_list;
                                    if (workflow_index < node.periodDetails.length - 1) {
                                        next_action_list = node.periodDetails[workflow_index + 1].lifeCyclePartVO.links;
                                    } else {
                                        if (workflow_batch_index < life.periodGroupRecordList[group_indicator].length - 1)
                                            next_action_list = life.periodGroupRecordList[group_indicator][workflow_batch_index + 1].periodDetails[0].lifeCyclePartVO.links;
                                    }
                                    let len_action_list = action_list.length; //节点列表元素个数
                                    let periodDetails_len = node.periodDetails.length; //工作流组中工作流数目
                                    let workflow_info = workflow.lifeCyclePartVO.workFlowDO; //工作流详情信息
                                    if (workflow_batch_index < life.periodGroupRecordList[group_indicator].length - 1) {
                                        next_is_para = life.periodGroupRecordList[group_indicator][workflow_batch_index + 1].runType > 1 ? 1 : 0;
                                        next_para_len = life.periodGroupRecordList[group_indicator][workflow_batch_index + 1].periodDetails.length;
                                    } else { //如果循环到工作流组最后一个工作流
                                        next_is_para = 0;
                                        next_para_len = 0;
                                    }
                                    //console.log("下一环节",node.runType);

                                    let current_runtype = node.runType > 1; //false是串行，true是并行

                                    let max_inner_para_num = 0, current_max_num = 0, next_max_num = 0;
                                    //for(let i = 0;;i++) {
                                    //将工作流节点分成一批批，并行放一堆，按顺序放置
                                    function formatAction(action_list) {
                                        let action_set = [];
                                        let len_action_list = action_list.length;
                                        let set_index = 0;
                                        for (let i = 0; i < len_action_list; i++) {
                                            if (typeof (action_set[set_index]) !== 'object') action_set[set_index] = [];
                                            if (action_list[i].currentRunType === 2) {
                                                action_set[set_index].push(action_list[i]);
                                            }
                                            if (action_list[i].currentRunType === 1) {
                                                if (i - 1 >= 0 && action_list[i - 1].currentRunType === 2) {
                                                    action_set[set_index].push(action_list[i]);
                                                } else {
                                                    action_set[set_index].push(action_list[i])
                                                }
                                                set_index++;
                                            }
                                        }
                                        return action_set;
                                    }

                                    let next_action_set, action_set;

                                    if (typeof (action_list) !== 'undefined') {
                                        action_set = formatAction(action_list);

                                        action_set.forEach(function (action_slice) {
                                            if (action_slice.length > max_inner_para_num) max_inner_para_num = action_slice.length;
                                        });
                                    }

                                    if (typeof (next_action_list) !== 'undefined') {
                                        next_action_set = formatAction(next_action_list);
                                        next_action_set.forEach(function (action_slice) {
                                            if (action_slice.length > next_max_num) next_max_num = action_slice.length;
                                        });
                                    }

                                    let workflow_style = {
                                        fill_color: "transparent",
                                        line_color: "silver",
                                        text_color: "silver"
                                    };

                                    if (workflow_batch_index === 0 && workflow_index === 0 && groupIndex === 0) { //如果是工作流组的第一个工作流
                                        workflow_annotaion = new WorkflowChain(current_term.connect_to_annotation_x, current_term.connect_to_annotation_y, workflow_style, workflow_info.flowName, workflow_info.id, IDLE, node.runType);
                                        current_term.mountWorkflow(workflow_annotaion);
                                        workflow_annotaion.linkFromLifeCycle(index, current_term.connect_len);
                                        // workflow_annotaion.group_name_model = workflow_annotaion.drawTextAnnotation(life.workflowGroupName, 'start', undefined, -70, -10);
                                        // workflow_annotaion.area.appendChild(workflow_annotaion.group_name_model);
                                        workflow_annotaion.createNode(next_max_num, next_max_num === 0);


                                    } else { //如果第一个工作流已经连接上
                                        workflow_annotaion = new WorkflowChain(null, null, workflow_style, workflow_info.flowName, workflow_info.id, IDLE, node.runType);
                                        current_term.mountWorkflow(workflow_annotaion);
                                        workflow_annotaion.createNode(next_max_num, next_max_num === 0);
                                        // if (next_max_num === 0 && groupIndex + 1 < data.data.length) {
                                        //     workflow_annotaion.group_name_model = workflow_annotaion.drawTextAnnotation(data.data[groupIndex + 1].workflowGroupName, 'start', undefined, -70, -10);
                                        //     workflow_annotaion.area.appendChild(workflow_annotaion.group_name_model);
                                        // }
                                    }


                                    let action_count = 0;
                                    let len_action_set = action_set.length;
                                    action_set.forEach(function (actions_slice, slice_index) { //工作流节点堆循环
                                        let inner_current_len_actions = actions_slice.length;
                                        let inner_current_runType = inner_current_len_actions > 1;
                                        let inner_next_len_actions, inner_next_runType;
                                        if (slice_index < len_action_set - 1) {
                                            inner_next_len_actions = action_set[slice_index + 1].length;
                                            inner_next_runType = action_set[slice_index + 1].length > 1;
                                        } else {
                                            inner_next_len_actions = 0;
                                            inner_next_runType = 0;
                                        }
                                        actions_slice.forEach(function (action, action_index) { //堆中工作流节点循环
                                            let new_action = new WorkflowLink(null, null, {line_color: "silver"}, len_action_set, action.linkName, action.id, inner_current_runType ? 2 : 1, action.linkStatus, action.processInstanceId);
                                            workflow_annotaion.mountAction(new_action, true);
                                            new_action.parent_workflow = workflow_annotaion;
                                            if (node.runType === 1) { //如果当前是串行工作流，则periodDetails数组只有一个元素
                                                if (action_count === len_action_list - 1) { //如果是最后一个工作流节点
                                                    new_action.createNode(FLAG, true, current_runtype, periodDetails_len, 0, next_is_para, next_para_len, inner_current_runType, inner_current_len_actions, action_index, inner_next_runType, inner_next_len_actions, next_max_num, len_action_set, slice_index);
                                                } else {
                                                    new_action.createNode(FLAG, false, current_runtype, periodDetails_len, 0, next_is_para, next_para_len, inner_current_runType, inner_current_len_actions, action_index, inner_next_runType, inner_next_len_actions, next_max_num, len_action_set, slice_index);
                                                }
                                            } else if (node.runType === 2) { //如果当前是并行工作流组，则periodDetails数组有多个元素
                                                if (action_count === len_action_list - 1) { //如果是最后一个工作流节点
                                                    new_action.createNode(FLAG, true, current_runtype, periodDetails_len, workflow_index, next_is_para, next_para_len, inner_current_runType, inner_current_len_actions, action_index, inner_next_runType, inner_next_len_actions, next_max_num, len_action_set, slice_index);
                                                } else {
                                                    new_action.createNode(FLAG, false, current_runtype, periodDetails_len, workflow_index, next_is_para, next_para_len, inner_current_runType, inner_current_len_actions, action_index, inner_next_runType, inner_next_len_actions, next_max_num, len_action_set, slice_index);
                                                }
                                            }

                                            action_count++;
                                        });
                                    });

                                    // 这段逻辑写明了被多次发起的工作流组放在候选组中，而通过下拉框选择后切换到对应的候选工作流组。
                                    // 所以在画图阶段就需要将所有候选工作流组都画一遍，这样切换的时候就是对应做显示和隐藏即可，
                                    // 所以在每个工作流组开始画的时候，将起始的坐标存到原型变量中，到遍历到同个工作流组不同
                                    // 候选工作流的时候，就用这个变量重置起始坐标，再画一遍。
                                    if (life.periodGroupRecordList.length > 1) {
                                        if (group_indicator !== life.periodGroupRecordList.length - 1) {
                                            WorkflowChain.prototype.next_y = WorkflowChain.prototype.next_y - workflow_annotaion.inter_annotation_len - workflow_annotaion.rect_height;
                                        }
                                    }

                                    // 这个flag控制画的方向
                                    if (FLAG === 0) { //flag为0，应该交替变换
                                        if (current_runtype === 0) { //如果是串行且当前是0，则flag直接变为1
                                            FLAG = 1;
                                        } else { //如果是并行且当前是0
                                            if (workflow_index === periodDetails_len - 1) { //如果是工作流组最后一个工作流，则应该变flag为1
                                                FLAG = 1;
                                            } else { //如果不是工作流组最后一个工作流，则不应该变FLAG
                                                FLAG = 0;
                                            }
                                        }
                                    } else { //flag为1，应该交替变换
                                        if (current_runtype === 0) { //如果是串行且当前是1，则flag直接变为0
                                            FLAG = 0;
                                        } else {
                                            if (workflow_index === periodDetails_len - 1) { //如果是工作流组最后一个工作流，则应该变flag为0
                                                FLAG = 0;
                                            } else { //如果不是工作流组最后一个工作流，则不应该变FLAG
                                                FLAG = 1;
                                            }
                                        }
                                    }
                                    workflow_groups.pushIntoGroup(groupIndex, group_indicator, workflow_annotaion, life.workflowGroupName);
                                    workflow_groups.setCandidateWorkflowName(groupIndex, life.periodGroupRecordNames[group_indicator], group_indicator);
                                });
                            });
                            FLAG = 0;
                            //设置边界节点样式
                            // 每个工作流组生成完毕应该讲ActionModel的原型公共属性给清空掉
                            WorkflowLink.refreshPrototypeVar();
                            self.setBoundingNode(current_term);
                        } // group_indicator for
                        // WorkflowChain.refreshPrototypeVar();
                    });// forEach groupIndex
                    workflow_groups.setDropdownEffect();

                    //生命周期json解析完毕

                    // 重新设置path，将相连的path组合，为了更好的动画效果
                    GraphHelper.reconstructPath(current_term);
                    setSVGWrapperHeight(document.getElementById('playground'), WorkflowChain.prototype.next_y);
                    //重置使用的原型变量，供下一个点击事件构建变量使用
                    LifecycleLink.refreshPrototypeVar();
                    // 遍历节点状态，后台已经实现
                    self.formatLinkStatusStyle();
                    WorkflowChain.refreshPrototypeVar();
                } // if data code
            // });
        // }); //queryLifecycleDetail

    } // lifecycleClick()
}

/**
 * StandaloneWorkflowController
 * 创建独立的工作流图，不依赖生命周期等
 */
class StandaloneWorkflowController {
    constructor(origin_x, origin_y) {
        this.origin_x = origin_x || 80;
        this.origin_y = origin_y || 80;
    }

    createWorkflow(data) {
        let lifecycle = new LifecycleLink(0, 0, {}, 1, "", {});

        let workflow_annotaion, next_is_para, next_para_len;
        let current_term = lifecycle;
        workflow_annotaion = new WorkflowChain(current_term.connect_to_annotation_x, current_term.connect_to_annotation_y, {}, "", undefined, IDLE, 1);
        current_term.mountWorkflow(workflow_annotaion);
        WorkflowLink.prototype.next_x = this.origin_x;
        WorkflowLink.prototype.next_y = this.origin_y;
        let action_list = data; //当前工作流中的节点列表

        let next_action_list;

        let len_action_list = action_list.length; //节点列表元素个数
        /*let periodDetails_len = node.periodDetails.length; //工作流组中工作流数目
        let workflow_info = workflow.lifeCyclePartVO.workFlowDO; //工作流详情信息
        if (workflow_batch_index < life.periodGroupRecordList[group_indicator].length - 1) {
            next_is_para = life.periodGroupRecordList[group_indicator][workflow_batch_index + 1].runType > 1 ? 1 : 0;
            next_para_len = life.periodGroupRecordList[group_indicator][workflow_batch_index + 1].periodDetails.length;
        } else { //如果循环到工作流组最后一个工作流
            next_is_para = 0;
            next_para_len = 0;
        }*/
        //console.log("下一环节",node.runType);

        // let current_runtype = node.runType > 1; //false是串行，true是并行

        let max_inner_para_num = 0, current_max_num = 0, next_max_num = 0;
        //for(let i = 0;;i++) {
        //将工作流节点分成一批批，并行放一堆，按顺序放置
        function formatAction(action_list) {
            let action_set = [];
            let len_action_list = action_list.length;
            let set_index = 0;
            for (let i = 0; i < len_action_list; i++) {
                if (typeof (action_set[set_index]) !== 'object') action_set[set_index] = [];
                if (action_list[i].currentRunType === 2) {
                    action_set[set_index].push(action_list[i]);
                }
                if (action_list[i].currentRunType === 1) {
                    if (i - 1 >= 0 && action_list[i - 1].currentRunType === 2) {
                        action_set[set_index].push(action_list[i]);
                    } else {
                        action_set[set_index].push(action_list[i])
                    }
                    set_index++;
                }
            }
            return action_set;
        }

        let action_set;

        if (typeof (action_list) !== 'undefined') {
            action_set = formatAction(action_list);

            action_set.forEach(function (action_slice) {
                if (action_slice.length > max_inner_para_num) max_inner_para_num = action_slice.length;
            });
        }

        let action_count = 0;
        let len_action_set = action_set.length;
        action_set.forEach(function (actions_slice, slice_index) { //工作流节点堆循环
            let inner_current_len_actions = actions_slice.length;
            let inner_current_runType = inner_current_len_actions > 1;
            let inner_next_len_actions, inner_next_runType;
            if (slice_index < len_action_set - 1) {
                inner_next_len_actions = action_set[slice_index + 1].length;
                inner_next_runType = action_set[slice_index + 1].length > 1;
            } else {
                inner_next_len_actions = 0;
                inner_next_runType = 0;
            }
            actions_slice.forEach(function (action, action_index) { //堆中工作流节点循环
                let new_action = new WorkflowLink(null, null, {line_color: "silver"}, len_action_set, action.linkName, action.id, inner_current_runType ? 2 : 1, action.linkStatus, action.processInstanceId);
                workflow_annotaion.mountAction(new_action, true);
                new_action.parent_workflow = workflow_annotaion;
                if (action_count === len_action_list - 1) { //如果是最后一个工作流节点
                    new_action.createNode(0, true, false, 1, 0, next_is_para, next_para_len, inner_current_runType, inner_current_len_actions, action_index, inner_next_runType, inner_next_len_actions, next_max_num, len_action_set, slice_index);
                } else {
                    new_action.createNode(0, false, false, 1, 0, next_is_para, next_para_len, inner_current_runType, inner_current_len_actions, action_index, inner_next_runType, inner_next_len_actions, next_max_num, len_action_set, slice_index);
                }
                action_count++;
            });
        });
        console.log(current_term);
        let len_of_workflowaction = current_term.workflow[0].action.length;
        current_term.workflow[0].action[len_of_workflowaction - 1].drawEndingNode();
    }
}
