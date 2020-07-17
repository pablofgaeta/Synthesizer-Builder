let Styles = {
   blue : '#89cff0',
   white : '#ffffff',
   gray : '#9a9a9a',
   yellow : '#fdfd96',
   red : '#e19191',
   green : '#86eda6',
}

Styles.synth_cardBG = Styles.gray;
Styles.synth_cardFG = Styles.green;

const isIterable = (object) => object != null && typeof object[Symbol.iterator] === 'function';

Element.prototype.hoverToggleBGColor = function(primary, secondary = primary) {
   this.style.backgroundColor = primary;
   this.onmouseenter = () => { this.style.backgroundColor = secondary; };
   this.onmouseout   = () => { this.style.backgroundColor = primary; };
}

Element.prototype.hoverToggleColor = function(primary, secondary = primary) {
   this.style.color = primary;
   this.onmouseenter = () => { this.style.color = secondary; };
   this.onmouseout   = () => { this.style.color = primary; };
}

function InputField(titleName, initVal, validators, callback, buttonName = 'Submit', rejectCallback = (v) => {}) {
   let VALID = true;

   let validInputColor = Styles.green + 'cf';
   let invalidInputColor = Styles.red + 'cc';

   let container = document.createElement('div');
   container.className = 'flex-container-center';

   let input_container = document.createElement('div');
   input_container.className = 'flex-container-center';
   input_container.style.width = '100%';

   let title = document.createElement('div');
   title.className = 'txt-s gray base-text';
   title.width = '100%';
   title.innerHTML = titleName;

   let input = document.createElement('input');
   input.className = 'input white';
   input.style.width = '50%';
   input.style.backgroundColor = validInputColor;
   input.value = initVal;
   input.oninput = () => {
      let val = input.value.trim();
      let discovered = false;
      validators.forEach(regex => {
         if (regex.test(val)) {
            discovered = VALID = true;
            input.style.backgroundColor = validInputColor;
            return;
         }
      })
      if (!discovered) {
         VALID = false;
         input.style.backgroundColor = invalidInputColor;
      }
   }

   let submit = document.createElement('button');
   submit.innerHTML = buttonName;
   submit.className = 'button-l submitter';
   submit.onkeyup = input.onkeyup = (event) => {
      if (['Return', 'Enter'].includes(event.key)) {
         if (VALID) callback(input.value);
         else       rejectCallback(input.value);
      }
   };
   submit.onclick = () => VALID ? callback(input.value) : rejectCallback(input.value);

   input_container.appendChild(input);
   input_container.appendChild(submit);

   container.appendChild(title);
   container.appendChild(input_container);

   return container;
}

Element.prototype.RegisterSubmit = function(primary, secondary, input, callback) {
   this.style.backgroundColor = primary;
   this.style.color = secondary;

   this.onkeydown = input.onkeydown = (event) => {
      if (['Return', 'Enter'].includes(event.key)) {
         this.style.color = primary;
         this.style.backgroundColor = secondary;
      }
   }

   this.onmousedown = () => {
      this.style.color = primary;
      this.style.backgroundColor = secondary;
   };

   this.onkeyup = input.onkeyup = (event) => {
      if (['Return', 'Enter'].includes(event.key)) {
         this.style.color = secondary;
         this.style.backgroundColor = primary;
         callback(input.value.trim());
      }
   }
   this.onmouseup = () => {
      this.style.color = secondary;
      this.style.backgroundColor = primary;
      callback(input.value.trim());
   };
}
