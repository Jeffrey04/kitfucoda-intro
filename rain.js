import Chance from "./chance.js";

import {
	concat,
	range,
} from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.min.js";
import { $ } from "./jquery/src/jquery.js";

const chance = new Chance();
const rows = 17;
const columns = 57;

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function check_is_arrived(destination, block) {
	return (
		destination &&
		destination[0] === $(block).data("row") &&
		destination[1] === $(block).data("col")
	);
}

function block_activate_start(
	event,
	drop_speed,
	fade_speed,
	destination,
	character,
) {
	const color = destination ? "#FFFFFF" : "#FFFF00";
	const to_display = check_is_arrived(destination, event.target)
		? character
		: chance.character();
	const chain = check_is_arrived(destination, event.target)
		? () => {}
		: () => {
				$(event.target).animate({ opacity: 0 }, fade_speed * 100);

				setTimeout(() => {
					$(event.target)
						.parent()
						.next()
						.find(`pre:nth-child(${$(event.target).data("col") + 1})`)
						.trigger("block:activate:start", [
							drop_speed,
							fade_speed,
							destination,
							character,
						]);
				}, drop_speed * 10);
			};

	$(event.target)
		.text(to_display)
		.css("color", color)
		.animate({ opacity: 100 }, 10, chain);
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
		.on("block:activate:start", block_activate_start);

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
		).get(0),
	);
}

function scene_start(event) {
	const candidates = chance.shuffle(range(columns));

	concat(
		candidates,
		[],
		//chance.pickset(candidates, Number.parseInt(columns / 3)),
	).forEach((col_idx, idx) => {
		let timeout = chance.integer({ min: 40, max: 100 });

		if (idx === 0) {
			timeout = 0;
		} else if (idx < 3) {
			timeout = 10;
		} else if (idx < 7) {
			timeout = 20;
		} else if (idx < 10) {
			timeout = 35;
		}

		delay(timeout * 100).then(() =>
			$(event.target).trigger("scene:block:get", [
				0,
				col_idx,
				(block) => {
					$(block).trigger("block:activate:start", [
						chance.integer({ min: 5, max: 12 }),
						chance.integer({ min: 7, max: 13 }),
					]);
				},
			]),
		);
	});

	delay(10000).then(() => $(event.target).trigger("scene:title"));
}

function title_card(event) {
	const TITLE = "KITFU CODA";
	const ORDER = chance.shuffle([
		50, 100, 150, 170, 370, 430, 590, 650, 800, 900,
	]);

	range(columns - 15, columns - 5).forEach((col_idx, idx) => {
		if (TITLE[idx] === " ") {
			return;
		}

		delay(ORDER[idx]).then(() =>
			$(event.target).trigger("scene:block:get", [
				0,
				col_idx,
				(block) => {
					$(block).trigger("block:activate:start", [
						chance.integer({ min: 8, max: 12 }),
						chance.integer({ min: 5, max: 10 }),
						[Number.parseInt(rows / 2), col_idx],
						TITLE[idx],
					]);
				},
			]),
		);
	});
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
		.on("scene:title", title_card)
		.on("scene:block:get", block_get);

	setTimeout(() => elem.trigger("scene:start"), 5000);

	$(window).click(() => {
		elem.trigger("scene:start");

		return false;
	});
});
