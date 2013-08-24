(function() {
	document.addEventListener("DOMContentLoaded", function() {

		var GestureMath = (function() {

			var AverageOfSet = function(set, property, transformer) {
				var sum = SumSet(set, property, transformer);
				var total = set.length;

				return sum / total;
			}

			var SumSet = function(set, property, transformer) {
				var sum = 0;
				var total = set.length;

				// this'll cause some poor performance instead
				// of just forgetting about transforming, but hey
				transformer = transformer || function(i){ return i; }

				if (typeof property === 'undefined') {
					for (var i = 0; i < total; i++)
						sum += transformer( set[i] );
				}
				else {
					for (var i = 0; i < total; i++)
						sum += transformer( set[i][property] );
				}

				return sum;
			}

			var WithinXOfY = function(input, target, tolerance) {
				return ( input > (target - tolerance) && input < (target + tolerance))
			}

			return {
				AverageOfSet : AverageOfSet,
				SumSet : SumSet,
				WithinXOfY : WithinXOfY
			};
		}());

		var Gesture = (function() {
			// basically an enum

			return {
				SWIPE : 0
			}

		}());

		var Swipe = (function() {

			return {
				RIGHT : 0
			};

		}());



		var GestureDetector = (function() {
			/* PRIVATE */
			var BoundGestures = {};

			var Settings = {
				MinimumVelocity : 30,
				AngleTolerance : 15,
				SimplicityTolerance : 100
			};

			var Points = [];

			var StartRecording = function(e) {
				Points = [];
				RecordPoint(e);
			}

			var RecordPoint = function(e) {
				Points.push({
					x : e.offsetX || e.pageX,
					y : e.offsetY || e.pageY
				});
			}

			var EndRecording = function(e) {
				RecordPoint(e);
				var Details = CalculateSwipeDetails();
				FireRelevantGestureEvents(Details);
				console.log(Details);
			}

			var CalculateSwipeDetails = function() {
				var Details = {
					Velocities : [],
					AnglesBetweenPoints : []
				};

				// Get the velocities between points
				var Velocities = Details.Velocities = [];
				for (var i = 1; i < Points.length; i++) {
					Velocities.push({
						vx : Points[i].x - Points[i - 1].x,
						vy : Points[i].y - Points[i - 1].y
					});
				}

				// Then get the average velocities
				Velocities.Average = {
					x : GestureMath.AverageOfSet(Velocities, "vx"),
					y : GestureMath.AverageOfSet(Velocities, "vy")
				};

				// Get the angle variance between points
				var AnglesBetweenPoints = Details.AnglesBetweenPoints = [];
				for (var i = 0; i < Velocities.length; i++)
					AnglesBetweenPoints.push( Math.atan2(Velocities[i].vy, Velocities[i].vx) * (180 / Math.PI) );

				// Get the average of those
				AnglesBetweenPoints.Average = GestureMath.AverageOfSet(AnglesBetweenPoints);

				Details.IsSimpleGesture = IsSimpleGesture(Velocities);

				return Details;
			}

			var IsSimpleGesture = function(velocities) {
				/*
					Checks to see if the distance between the
					start and end points of the gesture is within
					a reasonable range of the absolute sum of the
					velocities we recorded before

					naive implementation party 2013
				*/

				// First sum the velocities for both axes
				var sumVX = 0, sumVY = 0;
				for (var i = 0; i < velocities.length; i++) {
					sumVX += velocities[i].vx;
					sumVY += velocities[i].vy;
				}

				var sumVX = GestureMath.SumSet(velocities, "vx", Math.abs);
				var sumVY = GestureMath.SumSet(velocities, "vy", Math.abs);

				// then get what SHOULD be the total distance covered for both
				var distanceX = Points[Points.length - 1].x - Points[0].x;
				var distanceY = Points[Points.length - 1].y - Points[0].y;

				var isSimple =
					GestureMath.WithinXOfY(sumVX, distanceX, Settings.SimplicityTolerance ) &&
					GestureMath.WithinXOfY(sumVY, distanceY, Settings.SimplicityTolerance );

				return isSimple;
			}

			var FireRelevantGestureEvents = function(details) {

				if (details.IsSimpleGesture) {
					
					var events = BoundGestures[Gesture.SWIPE];
					for (var i = 0; i < events.length; i++) {

						if ( GestureMath.WithinXOfY( details.AnglesBetweenPoints.Average, events[i].angle, Settings.AngleTolerance ) ) {
							events[i].callback();
						}

					}

				}
				else {
					// WHAUUUGHHH???
				}

			}

			/* PUBLIC */
			var SetMinimumVelocity = function(v) {
				Settings.MinimumVelocity = v;
			}

			var SetAngleTolerance = function(at) {
				Settings.AngleTolerance = at;
			}

			var Bind = function(gestureType, options) {
				// Create array for gesture type if it does not exist
				if (typeof BoundGestures[gestureType] === 'undefined')
					BoundGestures[gestureType] = [];

				// add to that list
				BoundGestures[gestureType].push(options);
			}

			var Swipe = function(angle, callback) {
				// if the provided angle is negative, fix it
				angle = (angle < 0 ? angle + 360 : angle);

				Bind(Gesture.SWIPE, {
					angle : angle,
					callback : callback
				});
			}

			/* CONSTRUCTOR */
			document.addEventListener("mousedown", StartRecording);
			document.addEventListener("mousemove", RecordPoint);
			document.addEventListener("mouseup", EndRecording);

			return {
				SetMinimumVelocity : SetMinimumVelocity,
				SetAngleTolerance : SetAngleTolerance,
				Swipe : Swipe
			};
		}());

		window.Gesture = Gesture;
		window.Swipe = Swipe;
		window.GestureDetector = GestureDetector;

	});
	
})();