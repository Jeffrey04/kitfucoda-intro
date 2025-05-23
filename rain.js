import Chance from "./chance.js";

import {
	range,
	reverse,
} from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.min.js";
import { $ } from "./jquery/src/jquery.js";

const chance = new Chance();
const rows = 21;
const columns = 72;
const side_margin = 2;
const bottom_margin = 8;

function find_neighbour(elem) {
	return $(`pre:nth-child(${elem.data("col") + 1})`, elem.parent().next());
}

function block_activate(elem, char, color, fade_speed) {
	elem
		.css({
			color: "#FFF",
			opacity: 100,
		})
		.text(char);

	if (fade_speed !== false) {
		setTimeout(() => {
			elem.css("color", color).animate(
				{
					opacity: 0,
				},
				fade_speed,
			);
		}, 200);
	}
}

function block_activate_rain(event, color, drop_speed, fade_speed) {
	const elem = $(event.target);

	block_activate(elem, chance.character(), color, fade_speed);

	setTimeout(() => {
		find_neighbour(elem).trigger("block:activate:rain", [
			color,
			drop_speed,
			fade_speed,
		]);
	}, drop_speed);
}

function block_activate_target(
	event,
	color,
	drop_speed,
	fade_speed,
	character,
	target_row,
) {
	const elem = $(event.target);
	const is_arrived = elem.data("row") === target_row;

	block_activate(
		elem,
		is_arrived ? character : chance.character(),
		color,
		is_arrived ? false : fade_speed,
	);

	if (!is_arrived) {
		setTimeout(() => {
			find_neighbour(elem).trigger("block:activate:target", [
				color,
				drop_speed,
				fade_speed,
				character,
				target_row,
			]);
		}, drop_speed);
	}
}

function block_init(event, row_idx, col_idx) {
	$(event.target)
		.data("row", row_idx)
		.data("col", col_idx)
		.css("display", "inline")
		.text(" ")
		.css("opacity", 0)
		//.css("color", "#0FF")
		//.text("%")
		.on("block:activate:rain", block_activate_rain)
		.on("block:activate:target", block_activate_target);

	//setTimeout(
	//	() => {
	//		$(event.target).animate(
	//			{ opacity: 100 },
	//			chance.integer({ min: 100, max: 500 }) * 10,
	//			() => {
	//				$(event.target).animate(
	//					{ opacity: 0 },
	//					chance.integer({ min: 100, max: 500 }) * 10,
	//				);
	//			},
	//		);
	//	},
	//	chance.integer({ min: 5, max: 10 }) * 10,
	//);
}

function row_init(event, row_idx) {
	$(event.target).append(
		range(columns).map((col_idx) =>
			$(document.createElement("pre"))
				.on("block:init", block_init)
				.trigger("block:init", [row_idx, col_idx]),
		),
	);
}

function block_get(event, row_idx, col_idx, callback) {
	callback(
		$(
			`div:nth-child(${row_idx + 1}) pre:nth-child(${col_idx + 1})`,
			event.target,
		),
	);
}

function scene_rain(event) {
	chance.shuffle(range(columns)).forEach((col_idx, idx) => {
		let delay = chance.integer({ min: 20, max: 40 });
		let drop_speed = chance.integer({ min: 3, max: 6 });
		let fade_speed = chance.integer({ min: 3, max: 8 });

		if (idx === 0) {
			delay = 0;
			drop_speed = 7;
			fade_speed = 7;
		} else if (idx < 3) {
			delay = 13;
		} else if (idx < 7) {
			delay = 17;
		}

		setTimeout(() => {
			$(event.target).trigger("scene:block:get", [
				0,
				col_idx,
				(block) => {
					block.trigger("block:activate:rain", [
						chance.color(),
						drop_speed * 10,
						fade_speed * 100,
					]);
				},
			]);
		}, delay * 100);
	});
}

function scene_title(event) {
	const title = `
██   ██ ██ ████████ ███████ ██    ██  ██████  ██████  ██████   █████
██  ██  ██    ██    ██      ██    ██ ██      ██    ██ ██   ██ ██   ██
█████   ██    ██    █████   ██    ██ ██      ██    ██ ██   ██ ███████
██  ██  ██    ██    ██      ██    ██ ██      ██    ██ ██   ██ ██   ██
██   ██ ██    ██    ██       ██████   ██████  ██████  ██████  ██   ██
`.trim();

	reverse(title.split("\n")).forEach((line, row_idx) =>
		setTimeout(
			() =>
				line.split("").forEach((char, char_idx) => {
					if (char === " ") {
						return;
					}

					$(event.target).trigger("scene:block:get", [
						0,
						char_idx + 2,
						(block) => {
							block.trigger("block:activate:target", [
								chance.color(),
								20,
								40,
								char,
								rows - bottom_margin - 3 - row_idx,
							]);
						},
					]);
				}),
			300 * row_idx,
		),
	);
}

function break_title(title) {
	const max_length = columns - 4;
	if (title.length <= max_length) {
		return [title, ""];
	}

	const lines = [""];

	// biome-ignore lint/complexity/noForEach: <explanation>
	title
		.split(" ")
		.forEach((word) => {
			if (lines[lines.length - 1].length + word.length + 1 <= max_length) {
				lines[lines.length - 1] = lines[lines.length - 1]
					.concat(` ${word}`)
					.trim();
			} else {
				lines.push(word);
			}
		});

	if (lines.length > 2) {
		throw new Exception("Too many lines");
	}

	return lines;
}

function scene_subtitle(event, title) {
	const lines = break_title(title);

	// biome-ignore lint/complexity/noForEach: <explanation>
	reverse(lines).forEach((line, row_idx) =>
		setTimeout(
			() =>
				line.split("").forEach((char, char_idx) => {
					if (char === " ") {
						return;
					}
					$(event.target).trigger("scene:block:get", [
						0,
						char_idx + 2,
						(block) => {
							block.trigger("block:activate:target", [
								chance.color(),
								30,
								50,
								char,
								rows - bottom_margin - row_idx,
							]);
						},
					]);
				}),
			350 * row_idx,
		),
	);
}

function scene_start(event) {
	const elem = $(event.target);

	elem.trigger("scene:component:rain");

	setTimeout(() => {
		elem.trigger("scene:component:subtitle", [
			"The Unchaining: My Journey Beyond jQuery changes me so much that i feel like a different person",
		]);
	}, 5500);

	setTimeout(() => {
		elem.trigger("scene:component:title");
	}, 7000);
}

$(() => {
	const elem = $("#scene")
		.append(
			range(rows).map((row_idx) =>
				$(document.createElement("div"))
					.on("row:init", row_init)
					.trigger("row:init", [row_idx]),
			),
		)
		.on("scene:start", scene_start)
		.on("scene:component:rain", scene_rain)
		.on("scene:component:title", scene_title)
		.on("scene:component:subtitle", scene_subtitle)
		.on("scene:block:get", block_get);

	//delay(5000).then(() => elem.trigger("scene:start"));

	$(window).click(() => {
		elem.trigger("scene:start");

		return false;
	});
});
