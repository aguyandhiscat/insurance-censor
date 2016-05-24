// C. Pages
// C. Scaling
// C. Rectangles
// C. Colors
// Download
angular.module("App.controllers")
    .controller("index.controller", ["$scope",
        function ($scope) {
            var colors = [
                ["vivid_yellow", "rgb(255,179,0)"],
                ["strong_purple", "rgb(128,62,117)"],
                ["vivid_orange", "rgb(255,104,0)"],
                ["very_light_blue", "rgb(166,189,215)"],
                ["vivid_red", "rgb(193,0,32)"],
                ["grayish_yellow", "rgb(206,162,98)"],
                ["medium_gray", "rgb(129,112,102)"],
                ["vivid_green", "rgb(0,125,52)"],
                ["strong_purplish_pink", "rgb(246,118,142)"],
                ["strong_blue", "rgb(0,83,138)"],
                ["strong_yellowish_pink", "rgb(255,122,92)"],
                ["strong_violet", "rgb(83,55,122)"],
                ["vivid_orange_yellow", "rgb(255,142,0)"],
                ["strong_purplish_red", "rgb(179,40,81)"],
                ["vivid_greenish_yellow", "rgb(244,200,0)"],
                ["strong_reddish_brown", "rgb(127,24,13)"],
                ["vivid_yellowish_green", "rgb(147,170,0)"],
                ["deep_yellowish_brown", "rgb(89,51,21)"],
                ["vivid_reddish_orange", "rgb(241,58,19)"],
                ["dark_olive_green", "rgb(35,44,22)"]];
            $scope.colors = colors;

            var imageLoader = document.getElementById('imageLoader');
            imageLoader.addEventListener('change', handleImage, false);
            var canvas = document.getElementById('imageCanvas');
            var ctx = canvas.getContext('2d');
            var canvas_states = {};

            var hidden_canvas = document.createElement("canvas");
            var hidden_ctx = hidden_canvas.getContext("2d");

            var scaling_canvas = document.createElement("canvas");
            var scaling_ctx = scaling_canvas.getContext("2d");

            var output_canvas = document.createElement("canvas");
            var output_ctx = output_canvas.getContext("2d");

            var drawing_state = "drawing";

            var HANDLE_PADDING = 5;
            var GHOST_ALPHA = 0.3;
            var HANDLE_ALPHA = 1;
            var RECTANGLE_ALPHA = 0.7;
            var MAX_WIDTH = 999999;
            var MAX_HEIGHT = 500;
            var down = "down";
            var up = "up";
            var move = "move";
            var none = "none";
            var out = "out";
            var selected_color = "2222EE";
            var selected_page = 1;
            var downx;
            var downy;
            var movex;
            var movey;
            var upx;
            var upy;
            var current_mouse_state = none;
            var current_scale = 1;
            var CENSOR_ALPHA = 1.0;
            var CENSOR_COLOR = "rgb(0,0,0)";

            var pages = [];

            save_canvas_state(drawing_state, get_current_canvas_state());

            $scope.go_prev_page = function go_prev_page() {
                load_page(selected_page - 1);
            };

            $scope.go_next_page = function go_next_page() {
                load_page(selected_page + 1);
            };

            function is_event_image(event) {
                var regex;
                regex = new RegExp("^data:image");
                return regex.test(event.target.result);
            }

            function is_event_pdf(event) {
                var regex;
                regex = new RegExp("^data:application/pdf;");
                return regex.test(event.target.result);
            }

            function get_image_data_from_image(image) {
                _gd_resize_canvas(hidden_canvas, image.width, image.height);

                _gd_draw_image(hidden_ctx, image, 0, 0);

                return _gd_get_image_data(hidden_ctx, 0, 0, hidden_canvas.width, hidden_canvas.height);
            }

            function get_image_data_from_pdf_page(page) {
                var viewport = page.getViewport(1);

                _gd_resize_canvas(hidden_canvas, viewport.width, viewport.height);

                var renderContext = {
                    canvasContext: hidden_ctx,
                    viewport: viewport
                };
                var render_task = page.render(renderContext);

                return render_task.promise.then(function () {
                    return _gd_get_image_data(hidden_ctx, 0, 0, hidden_canvas.width, hidden_canvas.height);
                });
            }

            function do_image_upload(event) {
                var img = new Image();
                img.onload = function () {
                    var imagedata = get_image_data_from_image(img);

                    add_page(imagedata);
                };
                img.src = event.target.result;
            }

            function do_pdf_upload(event) {
                PDFJS.getDocument(event.target.result).then(function (pdf) {
                    do_pdf_page(pdf, 1);
                });

                function do_pdf_page(pdf, num) {
                    pdf.getPage(num).then(function (page) {
                        get_image_data_from_pdf_page(page).then(function (image_data) {
                            add_page(image_data);

                            if (num < pdf.numPages) {
                                do_pdf_page(pdf, num + 1);
                            }
                        });
                    });
                }
            }

            function add_page(image_data) {
                pages.push({
                    "imagedata": image_data,
                    "rectangles": []
                });

                if (pages.length === 1) {
                    load_page(0);
                }
            }

            function load_page(page_num) {
                if (page_num < 0 || pages.length <= page_num) {
                    return;
                }

                selected_page = page_num;
                var image_data = pages[page_num].imagedata;

                current_scale = get_scale(image_data.width, image_data.height, MAX_WIDTH, MAX_HEIGHT);

                resize_canvas(scaling_canvas, image_data.width, image_data.height, 1);
                _gd_put_image_data(scaling_ctx, image_data, 0, 0);

                var imageObject = new Image();
                imageObject.onload = function () {
                    resize_canvas(canvas, image_data.width, image_data.height, current_scale);
                    _gd_scale(ctx, current_scale);

                    _gd_draw_image(ctx, imageObject, 0, 0);

                    draw_page_rectangles(selected_page);
                };
                imageObject.src = scaling_canvas.toDataURL();
            }

            function _gd_scale(ctx, scale) {
                ctx.scale(scale, scale);
            }

            function resize_canvas(canvas, width, height, scale) {
                _gd_resize_canvas(canvas, get_scale_value(width, scale), get_scale_value(height, scale));
            }

            $scope.download_for_color = function download_for_color(color) {
                var doc = new jsPDF("p", 'pt', 'a4', false);
                var page_count = 1;

                angular.forEach(pages, function (page) {
                    var page_has_color = false,
                        other_color_rectangles = [];
                    angular.forEach(page["rectangles"], function (rectangle) {
                        if (rectangle[4] === color) {
                            page_has_color = true;
                        } else {
                            other_color_rectangles.push(rectangle);
                        }
                    });

                    if (page_has_color === true) {
                        if (page_count > 1) {
                            doc.addPage();
                        }
                        page_count++;

                        var image_data = page["imagedata"];

                        _gd_resize_canvas(output_canvas, image_data.width, image_data.height);
                        _gd_put_image_data(output_ctx, image_data, 0, 0);

                        angular.forEach(other_color_rectangles, function (rectangle) {
                            var x1 = rectangle[0],
                                y1 = rectangle[1],
                                x2 = rectangle[2],
                                y2 = rectangle[3];

                            lower_draw_rectangle(output_ctx, x1, y1, x2, y2, CENSOR_ALPHA, CENSOR_COLOR);
                        });

                        var pdf_image_data = output_canvas.toDataURL();
                        doc.addImage(pdf_image_data, "PNG", 0, 0, image_data.width, image_data.height);
                    }
                });

                doc.save("test.pdf");
            }

            function handleImage(e) {
                var reader = new FileReader();
                reader.onload = function (event) {
                    var result;
                    result = event.target.result;

                    if (is_event_image(event)) {
                        do_image_upload(event);
                    } else if (is_event_pdf(event)) {
                        do_pdf_upload(event);
                    } else {
                        window.alert("Unrecognizable File type");
                    }
                };

                reader.readAsDataURL(e.target.files[0]);
            }

            canvas.addEventListener("mousedown", function (ev) {
                set_mouse_state(down);
                downx = _gd_get_mouse_x(ev);
                downy = _gd_get_mouse_y(ev);

                save_canvas_state(drawing_state, get_current_canvas_state());
            });
            canvas.addEventListener("mousemove", function (ev) {
                if (is_mouse_state(down)) {
                    movex = _gd_get_mouse_x(ev);
                    movey = _gd_get_mouse_y(ev);
                    draw();
                }
            });
            canvas.addEventListener("mouseup", function (ev) {
                if (is_mouse_state(down)) {
                    set_mouse_state(up);
                    upx = _gd_get_mouse_x(ev);
                    upy = _gd_get_mouse_y(ev);
                    draw();
                }
            });
            canvas.addEventListener("mouseout", function (ev) {
                if (is_mouse_state(down)) {
                    set_mouse_state(out);
                    draw();
                }
            });

            $scope.pick_color = function (color) {
                set_color(color);
            };

            function set_color(color) {
                selected_color = color;
            }

            function get_color() {
                return selected_color;
            }

            function get_handle_color() {
                return "rgb(136,0,0)";
            }

            function get_ghost_color() {
                return "rgb(0,136,0)";
            }

            function draw() {
                // Should be that requestAnimation frame
                if (is_mouse_state(down)) {
                    load_canvas_state(drawing_state);
                    draw_ghost();
                } else if (is_mouse_state(up)) {
                    load_canvas_state(drawing_state);
                    draw_rectangle();
                    set_mouse_state(none);
                } else if (is_mouse_state(out)) {
                    load_canvas_state(drawing_state);
                    set_mouse_state(none);
                }
            }

            function draw_rectangle() {
                // Draw filled in rectangle based on current color
                var handlefirstx = get_unscale_value(downx, current_scale);
                var handlefirsty = get_unscale_value(downy, current_scale);
                var handlesecondx = get_unscale_value(upx, current_scale);
                var handlesecondy = get_unscale_value(upy, current_scale);

                var color = get_color();

                lower_draw_rectangle(ctx, handlefirstx, handlefirsty, handlesecondx, handlesecondy, RECTANGLE_ALPHA, color);

                store_page_rectangle(selected_page, color, handlefirstx, handlefirsty, handlesecondx, handlesecondy);
            }

            function lower_draw_rectangle(ctx, x1, y1, x2, y2, alpha, color) {
                _gd_set_alpha(ctx, alpha);

                _gd_set_fill_color(ctx, color);

                _gd_draw_rectangle(ctx, x1, y1, x2, y2);
            }

            function store_page_rectangle(page_num, color, x1, y1, x2, y2) {
                pages[page_num]["rectangles"].push([x1, y1, x2, y2, color]);
            }

            function draw_page_rectangles(page_num) {
                var rectangles = pages[page_num]["rectangles"];

                angular.forEach(rectangles, function (rectangle) {
                    var x1 = rectangle[0],
                        y1 = rectangle[1],
                        x2 = rectangle[2],
                        y2 = rectangle[3],
                        color = rectangle[4];
                    lower_draw_rectangle(ctx, x1, y1, x2, y2, RECTANGLE_ALPHA, color);
                });
            }

            function draw_ghost() {
                draw_ghost_rectangle();
                draw_handles();
            }

            function draw_handles() {
                var handlefirstx = get_unscale_value(downx, current_scale);
                var handlefirsty = get_unscale_value(downy, current_scale);
                var handlesecondx = get_unscale_value(movex, current_scale);
                var handlesecondy = get_unscale_value(movey, current_scale);

                draw_handle(handlefirstx, handlefirsty);
                draw_handle(handlesecondx, handlesecondy);
            }

            function draw_handle(x, y) {
                var x1 = x - HANDLE_PADDING;
                var y1 = y - HANDLE_PADDING;
                var x2 = x + HANDLE_PADDING;
                var y2 = y + HANDLE_PADDING;

                lower_draw_rectangle(ctx, x1, y1, x2, y2, HANDLE_ALPHA, get_handle_color());
            }

            function draw_ghost_rectangle() {
                var x1 = get_unscale_value(downx, current_scale);
                var y1 = get_unscale_value(downy, current_scale);
                var x2 = get_unscale_value(movex, current_scale);
                var y2 = get_unscale_value(movey, current_scale);

                lower_draw_rectangle(ctx, x1, y1, x2, y2, GHOST_ALPHA, get_ghost_color());
            }

            function get_scale_value(value, scale) {
                return (value * scale);
            }

            function get_unscale_value(value, scale) {
                return (value * (1 / scale));
            }

            function _gd_set_alpha(ctx, value) {
                ctx.globalAlpha = value;
            }

            function _gd_set_fill_color(ctx, color) {
                ctx.fillStyle = color;
            }

            function _gd_draw_rectangle(ctx, x1, y1, x2, y2) {
                var width = (x2 - x1);
                var height = (y2 - y1);
                ctx.fillRect(x1, y1, width, height);
            }

            function set_mouse_state(state) {
                current_mouse_state = state;
            }

            function is_mouse_state(state) {
                return ((state === current_mouse_state) ? true : false);
            }

            function _gd_get_mouse_x(ev) {
                return ev.offsetX;
            }

            function _gd_get_mouse_y(ev) {
                return ev.offsetY;
            }

            function _gd_draw_image(ctx, img, x, y) {
                ctx.drawImage(img, x, y);
            }

            function _gd_get_image_data(ctx, x, y, width, height) {
                return ctx.getImageData(x, y, width, height);
            }

            function _gd_put_image_data(ctx, imagedata, x, y) {
                ctx.putImageData(imagedata, x, y);
            }

            function _gd_resize_canvas(canvas, width, height) {
                canvas.width = width;
                canvas.height = height;
            }

            function get_current_canvas_state() {
                return _gd_get_image_data(ctx, 0, 0, canvas.width, canvas.height);
            }

            function save_canvas_state(name, state) {
                canvas_states[name] = state;
            }

            function load_canvas_state(name) {
                _gd_put_image_data(ctx, get_canvas_state(name), 0, 0);
            }

            function get_canvas_state(name) {
                return canvas_states[name];
            }

            function get_scale(width, height, max_width, max_height) {
                var ret = 1;
                if (height > max_height) {
                    ret = (max_height / height);
                }

                return ret;
            }

            var button = document.getElementById('btn-download');
            button.addEventListener('click', function (e) {
                var dataURL = canvas.toDataURL('image/png');
                button.href = dataURL;
            });
        }]);
