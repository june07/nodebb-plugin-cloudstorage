<div class="py-5">
  <div class="acp-page-container">
    <!-- IMPORT admin/partials/settings/header.tpl -->

    <div class="row m-0">
      
        <form class="cloudstorage-settings">

          <!-- Active Provider Select -->
          <div class="mb-3">
            <label for="activeProviderSelect" class="form-label">Active Cloud Provider</label>
            <select class="form-select" id="activeProviderSelect" name="activeProvider">
              <!-- BEGIN settings.providerSettings -->
              <option value="{@key}" <!-- IF ../disabled -->disabled<!-- END -->>{@key}</option>
              <!-- END settings.providerSettings -->
            </select>
            <div class="form-text">Only the active provider will be used for uploads.</div>
          </div>

          <!-- Provider Tabs -->
          <ul class="nav nav-pills mb-3">
            <!-- BEGIN settings.providerSettings -->
            <li class="nav-item">
              <a href="#" class="nav-link <!-- IF @first -->active<!-- END -->" 
                 data-bs-toggle="pill" data-bs-target="#{@key}">
                {@key}
              </a>
            </li>
            <!-- END settings.providerSettings -->
          </ul>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- BEGIN settings.providerSettings -->
            <div class="tab-pane fade <!-- IF @first -->show active<!-- END -->" 
                 id="{@key}" role="tabpanel">
              <div class="col-md-12">
                <div class="card mb-3">
                  <div class="card-header">
                    <img class="img-fluid" src="{../logo}" alt="{@key}" style="width:100px; height: 50px; margin-left: 0">
                  </div>

                  <div class="card-body">
                    <!-- Provider-specific fields -->

                    <!-- GitHub -->
                    <!-- IF storageProviderHelper(@key, "github") -->
                    <div class="mb-3">
                    <label class="form-label">GitHub Token</label>
                    <input type="password" class="form-control" name="{@key}-token" placeholder="Enter your GitHub Personal Access Token" autocomplete="new-password">
                    <div class="form-text">Required. Personal Access Token with repo write permissions.</div>
                    </div>

                    <div class="mb-3">
                    <label class="form-label">Repository Owner</label>
                    <input type="text" class="form-control" name="{@key}-owner" placeholder="Enter GitHub repository owner">
                    <div class="form-text">The GitHub account or organization that owns the repository.</div>
                    </div>

                    <div class="mb-3">
                    <label class="form-label">Repository Name</label>
                    <input type="text" class="form-control" name="{@key}-repo" placeholder="Enter GitHub repository name">
                    <div class="form-text">The repository where images will be uploaded.</div>
                    </div>

                    <div class="mb-3">
                    <label class="form-label">Repository Path</label>
                    <input type="text" class="form-control" name="{@key}-path" placeholder="Enter the folder path for uploads">
                    <div class="form-text">Relative path inside the repository where images will be stored, e.g., <code>uploads/</code>.</div>
                    </div>

                    <div class="mb-3">
                    <label class="form-label">Repository Branch</label>
                    <input type="text" class="form-control" name="{@key}-branch" placeholder="Enter the branch for uploads">
                    <div class="form-text">Git branch where images will be stored, e.g., <code>main</code>.</div>
                    </div>

                    <div class="mb-3">
                    <label class="form-label">CDN Origin URL</label>
                    <input type="text" class="form-control" name="{@key}-originUrl" placeholder="Enter GitHub Origin URL">
                    <div class="form-text">CDN Origin URL</div>
                    </div>
                    <!-- END -->

                    <!-- Cloudinary -->
                    <!-- IF storageProviderHelper(@key, "cloudinary") -->
                    <div class="mb-3">
                      <label class="form-label">Cloud Name</label>
                      <input type="text" class="form-control" name="{@key}-cloudname" placeholder="Enter your cloud name">
                      <div class="form-text">Mandatory. The name of your Cloudinary account.</div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">API Key</label>
                      <input type="text" class="form-control" name="{@key}-apikey" placeholder="Enter your API Key">
                      <div class="form-text">Mandatory for server-side operations.</div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">API Secret</label>
                      <input type="password" class="form-control" name="{@key}-secret" placeholder="Enter your API Secret" autocomplete="off">
                      <div class="form-text">Mandatory for server-side operations.</div>
                    </div>
                    <!-- END -->

                    <!-- ImageKit -->
                    <!-- IF storageProviderHelper(@key, "imagekit") -->
                    <div class="mb-3">
                      <label class="form-label">ImageKit ID</label>
                      <input type="text" class="form-control" name="{@key}-imagekit_id" placeholder="Enter your ImageKit ID">
                      <div class="form-text">The ImageKit Id associated with your account.</div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">API Key</label>
                      <input type="text" class="form-control" name="{@key}-public_key" placeholder="Enter your API Key">
                      <div class="form-text">Your public API key.</div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">API Secret</label>
                      <input type="password" class="form-control" name="{@key}-private_key" placeholder="Enter your API Secret" autocomplete="off">
                      <div class="form-text">Your private API secret.</div>
                    </div>
                    <!-- END -->

                    <!-- AWS S3 -->
                    <!-- IF storageProviderHelper(@key, "s3") -->
                    <div class="mb-3">
                      <label class="form-label">S3 Bucket</label>
                      <input type="text" class="form-control" name="{@key}-awss3_bucket" placeholder="Enter your AWS S3 Bucket">
                      <div class="form-text">The S3 Bucket you want your images stored in.</div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">S3 API Access Key Id</label>
                      <input type="text" class="form-control" name="{@key}-accessKeyId" placeholder="Enter your AWS access key ID">
                      <div class="form-text">Your AWS access key ID.</div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">S3 API Secret Acccess Key</label>
                      <input type="password" class="form-control" name="{@key}-secretAccessKey" placeholder="Enter your AWS secret access key" autocomplete="off">
                      <div class="form-text">Your AWS secret access key.</div>
                    </div>
                    <div class="mb-3">
                      <img class="img-fluid" src="{../cloudFrontLogo}" alt="{@key}" style="max-width:100px;">
                      <label class="form-label">CloudFront Domain Name</label>
                      <input type="text" class="form-control" name="{@key}-cloudFrontDomainName" placeholder="r4g77gsejasxig.cloudfront.net" autocomplete="off">
                      <div class="form-text">The CloudFront domain name associated with the S3 bucket above.</div>
                    </div>
                    <!-- END -->

                    <!-- Imgur -->
                    <!-- IF storageProviderHelper(@key, "imgur") -->
                    <p>Imgur support may be added in the future. Contribute on <a href="https://github.com/june07/nodebb-plugin-cloudstorage">GitHub</a>.</p>
                    <!-- END -->

                  </div>
                </div>
              </div>
            </div>
            <!-- END settings.providerSettings -->
          </div>
        </form>
      
        <h4>Help</h4>
        <iframe id="update-frame" frameborder="0" scrolling="no" src="https://june07.github.io/nodebb-plugin-cloudstorage/help" class="w-100" style="height:600px;"></iframe>
    </div>

    <!-- IMPORT admin/partials/settings/toc.tpl -->
  </div>
</div>
