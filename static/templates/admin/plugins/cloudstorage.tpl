<div class="py-5">
    <div class="container">
      <div class="row">
        <div class="col-md-6">
		  <h4>Settings</h4>

			<form class="cloudstorage-settings">

			<div class="form-group">
				<label for="activeProviderSelect">Active Cloud Provider</label>
				<select class="form-control" id="activeProviderSelect" name="activeProvider">
				<!-- BEGIN settings.providerSettings -->
				<option <!-- IF ../disabled -->disabled<!-- END -->>@key</option>
				<!-- END settings.providerSettings -->
				</select>
				<small class="form-text text-muted">Only the active provider will be used for uploads.</small>
			</div>

          <ul class="nav nav-pills">
		  <!-- BEGIN settings.providerSettings -->
			<li class="nav-item <!-- IF @first -->active in<!-- END -->"> <a href="#" class="active nav-link" data-toggle="pill" data-target="#@key">@key</a> </li>
		  <!-- END settings.providerSettings -->
          </ul>

          <div class="tab-content mt-2">
		  	<!-- BEGIN settings.providerSettings -->
            <div class="tab-pane fade <!-- IF @first -->active in<!-- END -->" id="@key" role="tabpanel">
              <p class="">
                <div class="col-md-12">
                    <div class="card">
                      <div class="card-header"><img class="img-fluid d-block" src="{../logo}" alt="@key" width="100px"></div>
                      <div class="card-body">
                        <h4></h4>
                        <p></p>
                      </div>
                    </div>
                    <!-- IF storageProviderHelper(@key, "cloudinary") -->
					<div class="form-group"> <label>Cloud Name</label>
						<input type="text" class="form-control" name="@key-cloudname" placeholder="Enter your cloud name" required="required">
						<small class="form-text text-muted">Mandatory. The name of your Cloudinary account. Used to build the public URL for all your media assets.</small> </div>
                    <div class="form-group"> <label>API Key</label>
						<input type="text" class="form-control" name="@key-apikey" placeholder="Enter your API Key" required="required">
						<small class="form-text text-muted">Mandatory for server-side operations. Used together with the API secret to communicate with the Cloudinary API and sign requests.</small> </div>
                    <div class="form-group"> <label>API Secret</label>
						<input type="password" class="form-control" name="@key-secret" placeholder="Enter your API Secret" required="required" autocomplete="off">
						<small class="form-text text-muted">Mandatory for server-side operations. Used together with the API key to communicate with the Cloudinary API and sign requests.</small> </div>
					<!-- END -->
					<!-- IF storageProviderHelper(@key, "imagekit") -->
					<div class="form-group"> <label>ImageKit ID</label>
						<input type="text" class="form-control" name="@key-imagekit_id" placeholder="Enter your ImageKit ID" required="required">
						<small class="form-text text-muted">The ImageKit Id associated with your account.</small> </div>
                    <div class="form-group"> <label>API Key</label>
						<input type="text" class="form-control" name="@key-public_key" placeholder="Enter your API Key" required="required">
						<small class="form-text text-muted">Your public API key.</small> </div>
                    <div class="form-group"> <label>API Secret</label>
						<input type="password" class="form-control" name="@key-private_key" placeholder="Enter your API Secret" required="required" autocomplete="off">
						<small class="form-text text-muted">Your private API secret.</small> </div>
					<!-- END -->
					<!-- IF storageProviderHelper(@key, "awss3") -->
					<div class="form-group"> <label>S3 Bucket</label>
						<input type="text" class="form-control" name="@key-awss3_bucket" placeholder="Enter your AWS S3 Bucket" required="required">
						<small class="form-text text-muted">The S3 Bucket you want your images stored in.</small> </div>
                    <div class="form-group"> <label>S3 API Access Key Id</label>
						<input type="text" class="form-control" name="@key-accessKeyId" placeholder="Enter your AWS access key ID" required="required">
						<small class="form-text text-muted">Your AWS access key ID.</small> </div>
                    <div class="form-group"> <label>S3 API Secret Acccess Key</label>
						<input type="password" class="form-control" name="@key-secretAccessKey" placeholder="Enter your AWS secret access key." required="required" autocomplete="off">
						<small class="form-text text-muted">Your AWS secret access key.</small> </div>
					<div><img class="img-fluid d-block" src="{../cloudFrontLogo}" alt="@key" width="100px"></div>
					<div class="form-group"> <label>CloudFront Domain Name</label>
						<input type="text" class="form-control" name="@key-cloudFrontDomainName" placeholder="r4g77gsejasxig.cloudfront.net" autocomplete="off">
						<small class="form-text text-muted">The CloudFront domain name associated with the S3 bucket above.</small> </div>
					<!-- END -->
					<!-- IF storageProviderHelper(@key, "imgur") -->
						Imgur support may be added in the future.  Feel free to contribute to <a href="https://github.com/june07/nodebb-plugin-cloudstorage">the project on GitHub</a>
					<!-- END -->
                </div>
              </p>
            </div>
			<!-- END settings.providerSettings -->
          </div>
		  </form>
        </div>
        <div class="col-md-6">
			<h4>Help</h4>
			<iframe id="update-frame" frameborder="0" scrolling="no" src="https://june07.github.io/nodebb-plugin-cloudstorage/help"></iframe>
		</div>
      </div>
    </div>
  </div>
  <button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>
